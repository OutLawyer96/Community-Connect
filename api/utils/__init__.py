"""
Utility functions for the Community Connect claim system.

This module provides helper functions for claim workflow operations,
email notifications, validation, and other common claim-related tasks.
"""

import secrets
import string
from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.db import transaction
from ..models import Claim, Provider


def generate_verification_token(length=32):
    """
    Generate a secure random verification token for email verification.
    
    Args:
        length (int): Length of the token (default: 32)
    
    Returns:
        str: Secure random token
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def send_claim_verification_email(claim):
    """
    Send email verification to claim submitter.
    
    Args:
        claim (Claim): The claim object to send verification for
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not claim.verification_token:
        claim.verification_token = generate_verification_token()
        claim.save()
    
    try:
        verification_url = f"{settings.FRONTEND_URL}/verify-claim/{claim.id}/?token={claim.verification_token}"
        
        context = {
            'claim': claim,
            'provider': claim.provider,
            'claimant': claim.claimant,
            'verification_url': verification_url,
            'site_name': 'Community Connect'
        }
        
        subject = f'Verify Your Business Claim - {claim.provider.business_name}'
        
        # HTML email template (you would create this template)
        html_message = render_to_string('emails/claim_verification.html', context)
        
        # Plain text fallback
        plain_message = f"""
        Hello {claim.claimant.get_full_name() or claim.claimant.username},
        
        You have submitted a claim for {claim.provider.business_name}.
        
        To verify your email and proceed with the claim process, please click the link below:
        {verification_url}
        
        If you didn't submit this claim, please ignore this email.
        
        Best regards,
        Community Connect Team
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[claim.claimant.email],
            html_message=html_message,
            fail_silently=False
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_claim_status_notification(claim, previous_status=None):
    """
    Send notification email when claim status changes.
    
    Args:
        claim (Claim): The claim object with updated status
        previous_status (str): Previous status for comparison
    """
    try:
        status_messages = {
            'approved': {
                'subject': f'Claim Approved - {claim.provider.business_name}',
                'message': f'Congratulations! Your claim for {claim.provider.business_name} has been approved. You now have access to manage this business listing.'
            },
            'rejected': {
                'subject': f'Claim Review Update - {claim.provider.business_name}',
                'message': f'Thank you for your claim submission for {claim.provider.business_name}. After review, we were unable to approve this claim at this time.'
            },
            'under_review': {
                'subject': f'Claim Under Review - {claim.provider.business_name}',
                'message': f'Your claim for {claim.provider.business_name} is now under review. We will notify you once the review is complete.'
            }
        }
        
        if claim.status in status_messages:
            notification = status_messages[claim.status]
            
            context = {
                'claim': claim,
                'provider': claim.provider,
                'claimant': claim.claimant,
                'status': claim.status,
                'admin_notes': claim.admin_notes,
                'site_name': 'Community Connect'
            }
            
            # You would create email templates for these
            template_name = f'emails/claim_{claim.status}.html'
            
            try:
                html_message = render_to_string(template_name, context)
            except:
                html_message = None
            
            send_mail(
                subject=notification['subject'],
                message=notification['message'],
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[claim.claimant.email],
                html_message=html_message,
                fail_silently=True
            )
            
    except Exception as e:
        print(f"Error sending status notification: {e}")


@transaction.atomic
def approve_claim(claim, reviewed_by, admin_notes=None):
    """
    Approve a claim and transfer provider ownership.
    Auto-reject other pending claims for the same provider.
    
    Args:
        claim (Claim): The claim to approve
        reviewed_by (User): The admin user approving the claim
        admin_notes (str): Optional admin notes
    
    Returns:
        bool: True if approval was successful
    """
    try:
        if claim.status != 'pending':
            raise ValueError("Only pending claims can be approved")
        
        # Defensive check: Ensure provider is not already claimed
        provider = claim.provider
        if provider.is_claimed:
            raise ValueError(f"Provider {provider.business_name} is already claimed by another user")
        
        # Defensive check: Ensure provider doesn't have another user assigned
        if provider.user and provider.user != claim.claimant:
            raise ValueError(f"Provider {provider.business_name} is already assigned to user {provider.user.username}")
        
        # Auto-reject other pending claims for the same provider
        other_pending_claims = Claim.objects.filter(
            provider=provider,
            status='pending'
        ).exclude(id=claim.id)
        
        auto_reject_notes = f"Auto-rejected: Another claim was approved for {provider.business_name}"
        for other_claim in other_pending_claims:
            other_claim.status = 'rejected'
            other_claim.reviewed_by = reviewed_by
            other_claim.reviewed_at = timezone.now()
            if other_claim.admin_notes:
                other_claim.admin_notes += f"\n{auto_reject_notes}"
            else:
                other_claim.admin_notes = auto_reject_notes
            other_claim.save()
            
            # Send notification to rejected claimants
            try:
                send_claim_status_notification(other_claim, 'pending')
            except Exception as e:
                print(f"Failed to send rejection notification for claim {other_claim.id}: {e}")
        
        # Update the approved claim status
        previous_status = claim.status
        claim.status = 'approved'
        claim.reviewed_by = reviewed_by
        claim.reviewed_at = timezone.now()
        if admin_notes:
            claim.admin_notes = admin_notes
        claim.save()
        
        # Transfer provider ownership
        provider.user = claim.claimant
        provider.is_claimed = True
        provider.save()
        
        # Send notification to approved claimant
        send_claim_status_notification(claim, previous_status)
        
        print(f"Approved claim {claim.id} and auto-rejected {other_pending_claims.count()} other pending claims")
        
        return True
        
    except Exception as e:
        print(f"Error approving claim: {e}")
        return False


@transaction.atomic
def reject_claim(claim, reviewed_by, admin_notes=None):
    """
    Reject a claim with optional admin notes.
    
    Args:
        claim (Claim): The claim to reject
        reviewed_by (User): The admin user rejecting the claim
        admin_notes (str): Optional admin notes explaining rejection
    
    Returns:
        bool: True if rejection was successful
    """
    try:
        if claim.status != 'pending':
            raise ValueError("Only pending claims can be rejected")
        
        # Update claim status
        previous_status = claim.status
        claim.status = 'rejected'
        claim.reviewed_by = reviewed_by
        claim.reviewed_at = timezone.now()
        if admin_notes:
            claim.admin_notes = admin_notes
        claim.save()
        
        # Send notification
        send_claim_status_notification(claim, previous_status)
        
        return True
        
    except Exception as e:
        print(f"Error rejecting claim: {e}")
        return False


def validate_claim_eligibility(user, provider):
    """
    Validate if a user is eligible to claim a specific provider.
    
    Args:
        user (User): The user attempting to claim
        provider (Provider): The provider being claimed
    
    Returns:
        tuple: (is_eligible, reason)
    """
    # Defensive check: Ensure provider is not already claimed
    if provider.is_claimed:
        return False, "Provider is already claimed"
    
    # Defensive check: Ensure provider doesn't have a user assigned
    if provider.user is not None:
        return False, "Provider is already assigned to another user"
    
    # Check if user has a pending or approved claim for this provider
    # Allow re-claiming after rejection
    blocking_claim = Claim.objects.filter(
        claimant=user,
        provider=provider,
        status__in=['pending', 'approved']  # Only block if pending or approved, not rejected
    ).exists()
    
    if blocking_claim:
        return False, "You have already submitted a claim for this provider that is pending or approved"
    
    # Check if user has too many pending claims
    pending_claims_count = Claim.objects.filter(
        claimant=user,
        status='pending'
    ).count()
    
    max_pending_claims = getattr(settings, 'MAX_PENDING_CLAIMS_PER_USER', 5)
    if pending_claims_count >= max_pending_claims:
        return False, f"You have reached the maximum number of pending claims ({max_pending_claims})"
    
    return True, "Eligible to claim"


def get_claim_statistics():
    """
    Get statistics about the claim system.
    
    Returns:
        dict: Statistics about claims and providers
    """
    total_providers = Provider.objects.count()
    claimed_providers = Provider.objects.filter(is_claimed=True).count()
    unclaimed_providers = Provider.objects.filter(is_claimed=False).count()
    
    total_claims = Claim.objects.count()
    pending_claims = Claim.objects.filter(status='pending').count()
    approved_claims = Claim.objects.filter(status='approved').count()
    rejected_claims = Claim.objects.filter(status='rejected').count()
    
    return {
        'providers': {
            'total': total_providers,
            'claimed': claimed_providers,
            'unclaimed': unclaimed_providers,
            'claim_rate': (claimed_providers / total_providers * 100) if total_providers > 0 else 0
        },
        'claims': {
            'total': total_claims,
            'pending': pending_claims,
            'approved': approved_claims,
            'rejected': rejected_claims,
            'approval_rate': (approved_claims / total_claims * 100) if total_claims > 0 else 0
        }
    }


def cleanup_expired_verification_tokens():
    """
    Clean up expired verification tokens from claims.
    This should be run periodically as a background task.
    
    Returns:
        int: Number of tokens cleaned up
    """
    # Tokens expire after 24 hours
    expiry_time = timezone.now() - timedelta(hours=24)
    
    expired_claims = Claim.objects.filter(
        email_verified=False,
        created_at__lt=expiry_time,
        verification_token__isnull=False
    )
    
    count = expired_claims.count()
    expired_claims.update(verification_token=None)
    
    return count


def get_similar_business_names(business_name, limit=5):
    """
    Find similar business names to help with duplicate detection.
    
    Args:
        business_name (str): Business name to search for
        limit (int): Maximum number of similar names to return
    
    Returns:
        list: List of similar provider business names
    """
    from django.db.models import Q
    
    # Simple similarity search - you could enhance this with more sophisticated algorithms
    words = business_name.lower().split()
    
    q_objects = Q()
    for word in words:
        if len(word) > 2:  # Skip very short words
            q_objects |= Q(business_name__icontains=word)
    
    similar_providers = Provider.objects.filter(q_objects).exclude(
        business_name__iexact=business_name
    )[:limit]
    
    return [provider.business_name for provider in similar_providers]


def format_claim_duration(claim):
    """
    Format the time since claim was submitted.
    
    Args:
        claim (Claim): The claim object
    
    Returns:
        str: Formatted duration string
    """
    duration = timezone.now() - claim.created_at
    
    if duration.days > 0:
        return f"{duration.days} day{'s' if duration.days != 1 else ''} ago"
    elif duration.seconds > 3600:
        hours = duration.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif duration.seconds > 60:
        minutes = duration.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"


# Phone verification utilities
def generate_phone_verification_code(length=6):
    """
    Generate a numeric verification code for phone verification.
    
    Args:
        length (int): Length of the code (default: 6)
    
    Returns:
        str: Numeric verification code
    """
    digits = string.digits
    return ''.join(secrets.choice(digits) for _ in range(length))


def send_phone_verification_sms(claim, phone_number):
    """
    Send SMS verification code to claim submitter.
    Note: This is scaffolding - actual SMS integration would require
    a service like Twilio, AWS SNS, or similar.
    
    Args:
        claim (Claim): The claim object to send verification for
        phone_number (str): Phone number to send verification to
    
    Returns:
        tuple: (success, verification_code or error_message)
    """
    try:
        # Generate verification code
        verification_code = generate_phone_verification_code()
        
        # In a real implementation, you would:
        # 1. Store the verification code with expiration
        # 2. Send SMS via your preferred service
        # 3. Handle delivery confirmations
        
        # Scaffolding: Log the code instead of sending SMS
        print(f"SMS Verification Code for claim {claim.id}: {verification_code}")
        print(f"Would send to phone: {phone_number}")
        print(f"Message: Your Community Connect verification code is: {verification_code}")
        
        # Return success with the code for testing
        return True, verification_code
        
    except Exception as e:
        print(f"Error in phone verification: {e}")
        return False, str(e)


def verify_phone_code(claim, submitted_code, stored_code):
    """
    Verify submitted phone verification code.
    
    Args:
        claim (Claim): The claim object
        submitted_code (str): Code submitted by user
        stored_code (str): Code that was sent via SMS
    
    Returns:
        bool: True if code is valid
    """
    # Simple string comparison - in production you'd also check expiration
    return submitted_code.strip() == stored_code.strip()


def defer_phone_verification(claim, reason="Document verification sufficient"):
    """
    Defer phone verification and proceed with document-only verification.
    
    Args:
        claim (Claim): The claim object
        reason (str): Reason for deferring phone verification
    
    Returns:
        bool: True if deferral was successful
    """
    try:
        # Add a note about phone verification deferral
        admin_note = f"Phone verification deferred: {reason}"
        if claim.admin_notes:
            claim.admin_notes += f"\n{admin_note}"
        else:
            claim.admin_notes = admin_note
        
        claim.save()
        
        print(f"Phone verification deferred for claim {claim.id}: {reason}")
        return True
        
    except Exception as e:
        print(f"Error deferring phone verification: {e}")
        return False


# Email template context helpers
def get_claim_email_context(claim):
    """
    Get common context variables for claim-related emails.
    
    Args:
        claim (Claim): The claim object
    
    Returns:
        dict: Context variables for email templates
    """
    return {
        'claim': claim,
        'provider': claim.provider,
        'claimant': claim.claimant,
        'claimant_name': claim.claimant.get_full_name() or claim.claimant.username,
        'provider_name': claim.provider.business_name,
        'claim_date': claim.created_at.strftime('%B %d, %Y'),
        'site_name': 'Community Connect',
        'support_email': settings.DEFAULT_FROM_EMAIL,
    }