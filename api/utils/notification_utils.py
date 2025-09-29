import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from ..models import Notification, NotificationPreference, User

logger = logging.getLogger(__name__)


def create_notification(user, notification_type, title, message, related_object=None):
    """
    Create a notification and handle email sending based on user preferences
    
    Args:
        user: User instance to notify
        notification_type: Type of notification (review, claim, message, system)
        title: Notification title
        message: Notification message
        related_object: Optional related model instance
    
    Returns:
        Notification instance
    """
    try:
        # Create notification
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            content_object=related_object
        )
        
        # Check user preferences and send email if enabled
        preferences = get_user_preferences(user)
        should_send_email = False
        
        if notification_type == 'review' and preferences.email_for_reviews:
            should_send_email = True
        elif notification_type == 'claim' and preferences.email_for_claims:
            should_send_email = True
        elif notification_type == 'message' and preferences.email_for_messages:
            should_send_email = True
        elif notification_type == 'system' and preferences.email_for_system:
            should_send_email = True
        
        if should_send_email:
            send_notification_email(notification)
        
        return notification
        
    except Exception as e:
        logger.error(f"Error creating notification for user {user.id}: {str(e)}")
        return None


def send_notification_email(notification):
    """
    Send email notification based on notification type
    
    Args:
        notification: Notification instance
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        user = notification.user
        context = get_notification_context(notification)
        
        # Determine email template and subject based on notification type
        template_map = {
            'review': {
                'template': 'email/review_received.html',
                'subject': f'New Review for {context.get("business_name", "Your Business")}'
            },
            'claim': {
                'template': 'email/claim_approved.html' if 'approved' in notification.title.lower() else 'email/claim_rejected.html',
                'subject': f'Claim Update - {notification.title}'
            },
            'message': {
                'template': 'email/new_message.html',
                'subject': f'New Message from {context.get("sender_name", "Community Connect")}'
            },
            'system': {
                'template': 'email/base.html',
                'subject': notification.title
            }
        }
        
        email_config = template_map.get(notification.notification_type)
        if not email_config:
            logger.warning(f"No email template configured for notification type: {notification.notification_type}")
            return False
        
        # Render email content
        html_content = render_to_string(email_config['template'], context)
        
        # Send email
        success = send_mail(
            subject=email_config['subject'],
            message=notification.message,  # Plain text fallback
            from_email=getattr(settings, 'NOTIFICATION_EMAIL_FROM', settings.DEFAULT_FROM_EMAIL),
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False
        )
        
        if success:
            notification.email_sent = True
            notification.save()
            logger.info(f"Email sent successfully for notification {notification.id}")
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending email for notification {notification.id}: {str(e)}")
        return False


def get_notification_context(notification):
    """
    Build template context for notification emails
    
    Args:
        notification: Notification instance
    
    Returns:
        dict: Template context
    """
    context = {
        'user': notification.user,
        'notification': notification,
        'site_name': 'Community Connect',
        'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
        'unsubscribe_url': f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/preferences"
    }
    
    # Add notification-specific context
    if notification.content_object:
        if notification.notification_type == 'review':
            if hasattr(notification.content_object, 'provider'):
                context['business_name'] = notification.content_object.provider.business_name
                context['review'] = notification.content_object
                context['dashboard_url'] = f"{context['site_url']}/dashboard"
        
        elif notification.notification_type == 'claim':
            if hasattr(notification.content_object, 'provider'):
                context['business_name'] = notification.content_object.provider.business_name
                context['claim'] = notification.content_object
                context['claim_url'] = f"{context['site_url']}/my-claims/{notification.content_object.id}"
        
        elif notification.notification_type == 'message':
            if hasattr(notification.content_object, 'sender'):
                sender = notification.content_object.sender
                context['sender_name'] = sender.get_full_name() or sender.username
                context['message_preview'] = notification.content_object.content[:150]
                context['messages_url'] = f"{context['site_url']}/messages"
    
    return context


def bulk_notify_users(users, notification_type, title, message, related_object=None):
    """
    Create notifications for multiple users
    
    Args:
        users: QuerySet or list of User instances
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        related_object: Optional related model instance
    
    Returns:
        int: Number of notifications created
    """
    batch_size = getattr(settings, 'NOTIFICATION_BATCH_SIZE', 100)
    created_count = 0
    
    try:
        # Create notifications in batches
        notifications_to_create = []
        
        for user in users:
            notification = Notification(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                content_object=related_object
            )
            notifications_to_create.append(notification)
            
            if len(notifications_to_create) >= batch_size:
                Notification.objects.bulk_create(notifications_to_create)
                created_count += len(notifications_to_create)
                notifications_to_create = []
        
        # Create remaining notifications
        if notifications_to_create:
            Notification.objects.bulk_create(notifications_to_create)
            created_count += len(notifications_to_create)
        
        logger.info(f"Created {created_count} bulk notifications of type {notification_type}")
        return created_count
        
    except Exception as e:
        logger.error(f"Error creating bulk notifications: {str(e)}")
        return 0


def cleanup_old_notifications(days=30, unread_days=90, batch_size=1000):
    """
    Clean up old notifications for maintenance
    
    Args:
        days: Number of days to keep read notifications (default 30)
        unread_days: Number of days to keep unread notifications (default 90)
        batch_size: Number of notifications to delete in each batch (default 1000)
    
    Returns:
        int: Total number of notifications deleted
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        old_unread_cutoff = timezone.now() - timedelta(days=unread_days)
        
        total_deleted = 0
        
        # Delete old read notifications in batches
        read_deleted = 0
        while True:
            batch = Notification.objects.filter(
                is_read=True,
                created_at__lt=cutoff_date
            )[:batch_size]
            
            if not batch.exists():
                break
                
            count = batch.delete()[0]
            read_deleted += count
            total_deleted += count
            
            if count < batch_size:
                break
        
        # Delete very old unread notifications in batches
        unread_deleted = 0
        while True:
            batch = Notification.objects.filter(
                is_read=False,
                created_at__lt=old_unread_cutoff
            )[:batch_size]
            
            if not batch.exists():
                break
                
            count = batch.delete()[0]
            unread_deleted += count
            total_deleted += count
            
            if count < batch_size:
                break
        
        logger.info(f"Cleaned up {total_deleted} old notifications ({read_deleted} read, {unread_deleted} unread)")
        
        return total_deleted
        
    except Exception as e:
        logger.error(f"Error cleaning up notifications: {str(e)}")
        return {'error': str(e)}


def get_user_preferences(user):
    """
    Get or create user notification preferences
    
    Args:
        user: User instance
    
    Returns:
        NotificationPreference instance
    """
    try:
        preferences, created = NotificationPreference.objects.get_or_create(
            user=user,
            defaults={
                'email_for_reviews': True,
                'email_for_claims': True,
                'email_for_messages': True,
                'email_for_system': True,
                'in_app_enabled': True,
            }
        )
        return preferences
    except Exception as e:
        logger.error(f"Error getting preferences for user {user.id}: {str(e)}")
        # Return default preferences if database error
        class DefaultPreferences:
            email_for_reviews = True
            email_for_claims = True
            email_for_messages = True
            email_for_system = True
            in_app_enabled = True
        
        return DefaultPreferences()


def generate_frontend_url(notification_type, related_object=None):
    """
    Generate frontend URLs for notifications
    
    Args:
        notification_type: Type of notification
        related_object: Related model instance
    
    Returns:
        str: Frontend URL or None
    """
    base_url = getattr(settings, 'SITE_URL', 'http://localhost:3000')
    
    if not related_object:
        return f"{base_url}/notifications"
    
    if notification_type == 'review' and hasattr(related_object, 'provider'):
        return f"{base_url}/providers/{related_object.provider.id}#reviews"
    elif notification_type == 'claim' and hasattr(related_object, 'id'):
        return f"{base_url}/my-claims/{related_object.id}"
    elif notification_type == 'message':
        return f"{base_url}/messages"
    
    return f"{base_url}/notifications"