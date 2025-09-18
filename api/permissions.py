"""
Custom permission classes for the Community Connect claim system.

These permissions ensure proper access control for claim-related operations,
including user ownership validation, admin privileges, and claim status restrictions.
"""

from rest_framework import permissions
from .models import Claim


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.owner == request.user


class IsClaimantOrReadOnly(permissions.BasePermission):
    """
    Custom permission for claim objects - only claimants can modify their claims.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Write permissions only for the claimant
        return obj.claimant == request.user


class CanModifyPendingClaim(permissions.BasePermission):
    """
    Permission that allows modification only if the claim is in pending status.
    Once approved or rejected, claims cannot be modified by regular users.
    """

    def has_object_permission(self, request, view, obj):
        # Allow read access
        if request.method in permissions.SAFE_METHODS:
            return True

        # For modifications, check if claim is pending and user is the claimant
        if isinstance(obj, Claim):
            # Staff can always modify
            if request.user.is_staff:
                return True
            
            # Claimants can only modify pending claims
            return (obj.claimant == request.user and 
                   obj.status == 'pending')
        
        return False


class IsStaffOrClaimantReadOnly(permissions.BasePermission):
    """
    Permission that allows:
    - Staff users: Full access to all claims
    - Regular users: Read-only access to their own claims
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Staff have full access
        if request.user.is_staff:
            return True
        
        # Non-staff users can only view their own claims
        if isinstance(obj, Claim):
            if request.method in permissions.SAFE_METHODS:
                return obj.claimant == request.user
            else:
                # No write access for non-staff to any claims
                return False
        
        return False


class CanApproveClaims(permissions.BasePermission):
    """
    Permission for claim approval/rejection actions.
    Only staff members can approve or reject claims.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        # Only staff can approve/reject claims
        return request.user.is_staff


class CanCreateClaim(permissions.BasePermission):
    """
    Permission for creating new claims.
    Users can only create claims for unclaimed providers.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # For POST requests, check if the provider is unclaimed
        if request.method == 'POST':
            provider_id = request.data.get('provider')
            if provider_id:
                from .models import Provider
                try:
                    provider = Provider.objects.get(id=provider_id)
                    # Check if provider is unclaimed
                    if provider.is_claimed:
                        return False
                    
                    # Check if user hasn't already claimed this provider
                    existing_claim = Claim.objects.filter(
                        provider=provider,
                        claimant=request.user
                    ).exists()
                    return not existing_claim
                    
                except Provider.DoesNotExist:
                    return False
        
        return True


class IsProviderOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission for provider objects.
    Only the associated user can modify their provider profile.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions for anyone
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the provider's user
        return obj.user == request.user


class CanAccessClaimDocuments(permissions.BasePermission):
    """
    Permission for accessing claim documents.
    Only the claimant, staff, or related parties can access documents.
    """

    def has_object_permission(self, request, view, obj):
        # Staff can access all documents
        if request.user.is_staff:
            return True
        
        # Claimants can access their own claim documents
        if isinstance(obj, Claim):
            return obj.claimant == request.user
        
        return False


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Generic permission: object owner or staff member.
    """

    def has_object_permission(self, request, view, obj):
        # Staff have full access
        if request.user.is_staff:
            return True
        
        # Check various owner attributes
        owner_attrs = ['user', 'owner', 'claimant', 'created_by']
        for attr in owner_attrs:
            if hasattr(obj, attr):
                owner = getattr(obj, attr)
                if owner == request.user:
                    return True
        
        return False


# Permission composition utilities
def combine_permissions(*permission_classes):
    """
    Utility function to combine multiple permission classes.
    All permissions must pass for access to be granted.
    """
    class CombinedPermission(permissions.BasePermission):
        def has_permission(self, request, view):
            return all(
                perm().has_permission(request, view) 
                for perm in permission_classes
            )

        def has_object_permission(self, request, view, obj):
            return all(
                perm().has_object_permission(request, view, obj)
                for perm in permission_classes
            )
    
    return CombinedPermission


# Enhanced permission for claim detail view with object-level security
class ClaimOwnerOrStaffPermission(permissions.BasePermission):
    """
    Object-level permission for claim detail view.
    - Staff: Full access to all claims
    - Claimants: Access only to their own claims
    - Modifications restricted based on claim status
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Staff have full access
        if request.user.is_staff:
            return True
        
        # Must be the claimant to access
        if not isinstance(obj, Claim) or obj.claimant != request.user:
            return False
        
        # Read access allowed for own claims
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write access only allowed for pending claims
        return obj.status == 'pending'


# Common permission combinations for views
ClaimOwnerPermission = ClaimOwnerOrStaffPermission

ClaimAdminPermission = combine_permissions(
    permissions.IsAuthenticated,
    CanApproveClaims
)

ClaimCreatePermission = combine_permissions(
    permissions.IsAuthenticated,
    CanCreateClaim
)