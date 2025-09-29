import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Review, Claim, Message, User, Provider, Favorite, UserBehavior, UserRecommendation
from .utils.notification_utils import create_notification

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Review)
def create_review_notification(sender, instance, created, **kwargs):
    """
    Create notification when a new review is posted
    """
    if created and instance.provider:
        try:
            # Get the provider user
            provider_user = instance.provider.user
            if not provider_user:
                # Unclaimed provider; no one to notify
                return
            
            # Create notification for the provider
            create_notification(
                user=provider_user,
                notification_type='review',
                title=f'New {instance.rating}-star review received',
                message=(
                    (
                        f'You received a new review from '
                        f"{(instance.user.get_full_name() or instance.user.username) if instance.user else 'a user'}: "
                        f'"{instance.comment[:100]}..."'
                    )
                    if instance.comment
                    else f'You received a new {instance.rating}-star review.'
                ),
                related_object=instance
            )
            
            logger.info(f"Review notification created for provider {provider_user.id}")
            
        except Exception as e:
            logger.error(f"Error creating review notification: {str(e)}")


@receiver(pre_save, sender=Claim)
def track_claim_status_change(sender, instance, **kwargs):
    """
    Track claim status changes to send notifications
    """
    if instance.pk:  # Only for existing claims
        try:
            old_claim = Claim.objects.get(pk=instance.pk)
            instance._old_status = old_claim.status
        except Claim.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Claim)
def create_claim_notification(sender, instance, created, **kwargs):
    """
    Create notification when claim is created or its status changes
    """
    try:
        if created:
            # Notify claimant that claim was submitted
            create_notification(
                user=instance.claimant,
                notification_type='claim',
                title='Claim Submitted',
                message=f'Your claim for {instance.provider.business_name} has been submitted and is pending review.',
                related_object=instance,
            )
            return

        # Check if status changed
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            if instance.status == 'approved':
                create_notification(
                    user=instance.claimant,
                    notification_type='claim',
                    title='Claim Approved!',
                    message=f'Your claim for {instance.provider.business_name} has been approved. You can now manage your business listing.',
                    related_object=instance,
                )
            elif instance.status == 'rejected':
                reason = instance.admin_notes or 'Please review the requirements and try again.'
                create_notification(
                    user=instance.claimant,
                    notification_type='claim',
                    title='Claim Rejected',
                    message=f'Your claim for {instance.provider.business_name} has been rejected. Reason: {reason}',
                    related_object=instance,
                )
            logger.info(
                f"Claim status notification sent to user {instance.claimant.id} for status change to {instance.status}"
            )
    except Exception as e:
        logger.error(f"Error creating claim notification: {str(e)}")


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """
    Create notification when a new message is sent
    """
    if created:
        try:
            # Get the recipient (the other participant in the thread)
            recipient = instance.thread.get_other_participant(instance.sender)
            
            # Create notification for the recipient
            sender_name = instance.sender.get_full_name() or instance.sender.username
            message_preview = instance.content[:100] + ('...' if len(instance.content) > 100 else '')
            
            create_notification(
                user=recipient,
                notification_type='message',
                title=f'New message from {sender_name}',
                message=f'{sender_name} sent you a message: "{message_preview}"',
                related_object=instance
            )
            
            logger.info(f"Message notification created for user {recipient.id}")
            
        except Exception as e:
            logger.error(f"Error creating message notification: {str(e)}")


@receiver(pre_save, sender=Provider)
def track_provider_verification_change(sender, instance, **kwargs):
    """
    Track changes to provider verification status
    """
    if instance.pk:  # Only for existing providers
        try:
            old_provider = Provider.objects.get(pk=instance.pk)
            instance._old_is_verified = old_provider.is_verified
        except Provider.DoesNotExist:
            instance._old_is_verified = None
    else:
        instance._old_is_verified = None


@receiver(post_save, sender=Provider)
def create_provider_verification_notification(sender, instance, created, **kwargs):
    """
    Create notification when provider verification status changes
    """
    if not created and instance.user:  # Only for existing providers with associated users
        try:
            old_is_verified = getattr(instance, '_old_is_verified', None)
            if old_is_verified is not None and old_is_verified != instance.is_verified:
                
                if instance.is_verified:
                    create_notification(
                        user=instance.user,
                        notification_type='system',
                        title='Provider Profile Verified',
                        message='Congratulations! Your provider profile has been verified. You can now receive bookings and reviews from customers.',
                        related_object=instance
                    )
                else:
                    create_notification(
                        user=instance.user,
                        notification_type='system',
                        title='Provider Profile Unverified',
                        message='Your provider profile verification has been revoked. Please contact support if you believe this is an error.',
                        related_object=instance
                    )
                
                logger.info(f"Provider verification notification sent to user {instance.user.id}")
                
        except Exception as e:
            logger.error(f"Error creating provider verification notification: {str(e)}")


@receiver(post_save, sender=User)
def create_welcome_notification(sender, instance, created, **kwargs):
    """
    Create welcome notification for new users
    """
    if created:
        try:
            if instance.role == 'customer':
                title = 'Welcome to Community Connect!'
                message = 'Welcome! You can now browse and review local service providers. Start exploring to find the services you need.'
            elif instance.role == 'provider':
                title = 'Welcome to Community Connect!'
                message = 'Welcome! Complete your provider profile to start attracting customers and receiving reviews for your services.'
            else:
                title = 'Welcome to Community Connect!'
                message = 'Welcome to Community Connect! Your account has been created successfully.'
            
            create_notification(
                user=instance,
                notification_type='system',
                title=title,
                message=message,
                related_object=None
            )
            
            logger.info(f"Welcome notification created for new user {instance.id}")
            
        except Exception as e:
            logger.error(f"Error creating welcome notification: {str(e)}")


# Signal to create default notification preferences
@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """
    Create default notification preferences for new users
    """
    if created:
        try:
            from .models import NotificationPreference
            NotificationPreference.objects.get_or_create(
                user=instance,
                defaults={
                    'email_for_reviews': True,
                    'email_for_claims': True,
                    'email_for_messages': True,
                    'email_for_system': True,
                    'in_app_enabled': True,
                }
            )
            logger.info(f"Default notification preferences created for user {instance.id}")
            
        except Exception as e:
            logger.error(f"Error creating notification preferences: {str(e)}")


# Custom signal for system-wide notifications
def send_system_notification(users, title, message):
    """
    Send system notification to multiple users
    
    Args:
        users: QuerySet or list of User instances
        title: Notification title
        message: Notification message
    """
    try:
        from .utils.notification_utils import bulk_notify_users
        
        count = bulk_notify_users(
            users=users,
            notification_type='system',
            title=title,
            message=message
        )
        
        logger.info(f"System notification sent to {count} users: {title}")
        return count
        
    except Exception as e:
        logger.error(f"Error sending system notification: {str(e)}")
        return 0


@receiver(post_save, sender=Favorite)
def log_favorite_behavior(sender, instance, created, **kwargs):
    """Log user behavior when a favorite is added"""
    if created and instance.user and instance.provider:
        try:
            UserBehavior.objects.create(
                user=instance.user,
                action_type='favorite',
                provider=instance.provider
            )
            logger.info(f"Logged favorite behavior for user {instance.user.id}")
        except Exception as e:
            logger.error(f"Error logging favorite behavior: {e}")


@receiver(post_save, sender=Review)
def log_review_behavior(sender, instance, created, **kwargs):
    """Log user behavior when a review is created"""
    if created and instance.user and instance.provider:
        try:
            # This is handled separately from the review notification
            # to avoid duplicating behavior tracking in views
            pass  # Reviews are already logged via view behavior tracking
        except Exception as e:
            logger.error(f"Error logging review behavior: {e}")


@receiver(post_save, sender=Favorite)
def invalidate_user_recommendations(sender, instance, created, **kwargs):
    """Invalidate user recommendations when significant behavior changes occur"""
    if created and instance.user:
        try:
            # Delete cached recommendations to trigger rebuild
            deleted_count = UserRecommendation.objects.filter(
                user=instance.user
            ).delete()[0]
            
            if deleted_count > 0:
                logger.info(f"Invalidated {deleted_count} recommendations for user {instance.user.id}")
                
        except Exception as e:
            logger.error(f"Error invalidating user recommendations: {e}")


@receiver(post_save, sender=Review)
def invalidate_recommendations_on_review(sender, instance, created, **kwargs):
    """Invalidate recommendations when user adds a review"""
    if created and instance.user:
        try:
            # Delete cached recommendations to trigger rebuild
            deleted_count = UserRecommendation.objects.filter(
                user=instance.user
            ).delete()[0]
            
            if deleted_count > 0:
                logger.info(f"Invalidated {deleted_count} recommendations for user {instance.user.id} after review")
                
        except Exception as e:
            logger.error(f"Error invalidating recommendations after review: {e}")


@receiver(post_save, sender=User)
def assign_ab_test_on_registration(sender, instance, created, **kwargs):
    """Assign user to A/B test variants on registration"""
    if created:
        try:
            from .utils.ab_testing import ABTestManager
            
            ab_manager = ABTestManager()
            
            # Assign to active experiments
            active_experiments = ['recommendation_weights', 'cold_start_strategy', 'recommendation_count']
            
            for experiment in active_experiments:
                if ab_manager.is_experiment_active(experiment):
                    variant = ab_manager.assign_user_to_variant(instance, experiment)
                    logger.info(f"Assigned new user {instance.id} to {experiment}: {variant}")
                    
        except Exception as e:
            logger.error(f"Error assigning A/B test variants to new user {instance.id}: {e}")