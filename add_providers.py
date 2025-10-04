#!/usr/bin/env python
"""Script to add sample providers to the database"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Provider, Category, Service
from decimal import Decimal

def add_sample_providers():
    """Add sample providers to the database"""
    
    # Create or get categories
    categories_data = [
        {'name': 'Home Services', 'description': 'Home repair and maintenance services'},
        {'name': 'Professional Services', 'description': 'Legal, accounting, and consulting services'},
        {'name': 'Health & Wellness', 'description': 'Healthcare and wellness services'},
        {'name': 'Education', 'description': 'Tutoring and educational services'},
        {'name': 'Technology', 'description': 'IT and tech support services'},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        categories[cat_data['name']] = category
        print(f"{'Created' if created else 'Found'} category: {category.name}")
    
    # Sample providers data
    providers_data = [
        {
            'username': 'john_plumber',
            'email': 'john@plumbingpros.com',
            'first_name': 'John',
            'last_name': 'Smith',
            'business_name': "John's Plumbing Pros",
            'category': 'Home Services',
            'bio': 'Professional plumber with 15 years of experience. Specializing in residential and commercial plumbing repairs.',
            'phone': '555-0101',
            'address': '123 Main St, Seattle, WA 98101',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98101',
            'is_verified': True,
            'services': [
                {'name': 'Emergency Plumbing', 'description': '24/7 emergency plumbing services', 'price': '150.00'},
                {'name': 'Drain Cleaning', 'description': 'Professional drain cleaning and maintenance', 'price': '85.00'},
                {'name': 'Pipe Repair', 'description': 'Residential and commercial pipe repair', 'price': '120.00'},
            ]
        },
        {
            'username': 'sarah_lawyer',
            'email': 'sarah@lawfirm.com',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'business_name': 'Johnson Legal Services',
            'category': 'Professional Services',
            'bio': 'Experienced attorney specializing in family law and estate planning. Dedicated to providing personalized legal solutions.',
            'phone': '555-0102',
            'address': '456 Legal Ave, Seattle, WA 98102',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98102',
            'is_verified': True,
            'services': [
                {'name': 'Legal Consultation', 'description': 'Initial legal consultation', 'price': '200.00'},
                {'name': 'Estate Planning', 'description': 'Comprehensive estate planning services', 'price': '500.00'},
                {'name': 'Family Law', 'description': 'Family law representation', 'price': '300.00'},
            ]
        },
        {
            'username': 'mike_electrician',
            'email': 'mike@sparkelectric.com',
            'first_name': 'Mike',
            'last_name': 'Williams',
            'business_name': 'Spark Electric Co.',
            'category': 'Home Services',
            'bio': 'Licensed electrician providing safe and reliable electrical services for homes and businesses.',
            'phone': '555-0103',
            'address': '789 Electric Blvd, Seattle, WA 98103',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98103',
            'is_verified': True,
            'services': [
                {'name': 'Electrical Repair', 'description': 'General electrical repairs', 'price': '95.00'},
                {'name': 'Panel Upgrade', 'description': 'Electrical panel upgrades', 'price': '800.00'},
                {'name': 'Wiring Installation', 'description': 'New wiring installation', 'price': '150.00'},
            ]
        },
        {
            'username': 'lisa_accountant',
            'email': 'lisa@taxpros.com',
            'first_name': 'Lisa',
            'last_name': 'Brown',
            'business_name': 'Brown Tax & Accounting',
            'category': 'Professional Services',
            'bio': 'Certified Public Accountant with expertise in tax preparation and business accounting.',
            'phone': '555-0104',
            'address': '321 Finance St, Seattle, WA 98104',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98104',
            'is_verified': True,
            'services': [
                {'name': 'Tax Preparation', 'description': 'Individual and business tax preparation', 'price': '250.00'},
                {'name': 'Bookkeeping', 'description': 'Monthly bookkeeping services', 'price': '400.00'},
                {'name': 'Tax Planning', 'description': 'Strategic tax planning consultation', 'price': '300.00'},
            ]
        },
        {
            'username': 'david_tutor',
            'email': 'david@mathtutoring.com',
            'first_name': 'David',
            'last_name': 'Martinez',
            'business_name': 'Martinez Math Tutoring',
            'category': 'Education',
            'bio': 'Experienced math tutor specializing in high school and college level mathematics.',
            'phone': '555-0105',
            'address': '654 Education Way, Seattle, WA 98105',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98105',
            'is_verified': True,
            'services': [
                {'name': 'Math Tutoring', 'description': 'One-on-one math tutoring sessions', 'price': '60.00'},
                {'name': 'SAT Prep', 'description': 'SAT math preparation', 'price': '75.00'},
                {'name': 'Calculus Help', 'description': 'Advanced calculus tutoring', 'price': '80.00'},
            ]
        },
        {
            'username': 'emma_therapist',
            'email': 'emma@wellnesstherapy.com',
            'first_name': 'Emma',
            'last_name': 'Davis',
            'business_name': 'Wellness Therapy Center',
            'category': 'Health & Wellness',
            'bio': 'Licensed therapist providing counseling and mental health services.',
            'phone': '555-0106',
            'address': '987 Wellness Rd, Seattle, WA 98106',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98106',
            'is_verified': True,
            'services': [
                {'name': 'Individual Therapy', 'description': 'One-on-one therapy sessions', 'price': '120.00'},
                {'name': 'Couples Counseling', 'description': 'Relationship counseling', 'price': '150.00'},
                {'name': 'Group Therapy', 'description': 'Group therapy sessions', 'price': '50.00'},
            ]
        },
        {
            'username': 'james_ittech',
            'email': 'james@techsupport.com',
            'first_name': 'James',
            'last_name': 'Wilson',
            'business_name': 'Wilson IT Solutions',
            'category': 'Technology',
            'bio': 'IT professional providing computer repair and tech support services.',
            'phone': '555-0107',
            'address': '147 Tech Plaza, Seattle, WA 98107',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98107',
            'is_verified': True,
            'services': [
                {'name': 'Computer Repair', 'description': 'Desktop and laptop repair', 'price': '85.00'},
                {'name': 'Network Setup', 'description': 'Home and office network setup', 'price': '150.00'},
                {'name': 'Virus Removal', 'description': 'Malware and virus removal', 'price': '75.00'},
            ]
        },
        {
            'username': 'maria_cleaner',
            'email': 'maria@sparkleclean.com',
            'first_name': 'Maria',
            'last_name': 'Garcia',
            'business_name': 'Sparkle Clean Services',
            'category': 'Home Services',
            'bio': 'Professional cleaning service for residential and commercial properties.',
            'phone': '555-0108',
            'address': '258 Clean St, Seattle, WA 98108',
            'city': 'Seattle',
            'state': 'WA',
            'zip_code': '98108',
            'is_verified': True,
            'services': [
                {'name': 'House Cleaning', 'description': 'Deep house cleaning service', 'price': '120.00'},
                {'name': 'Office Cleaning', 'description': 'Commercial office cleaning', 'price': '200.00'},
                {'name': 'Move-Out Cleaning', 'description': 'Complete move-out cleaning', 'price': '250.00'},
            ]
        },
    ]
    
    print("\n" + "="*50)
    print("Adding Providers and Services")
    print("="*50 + "\n")
    
    for provider_data in providers_data:
        # Create user
        user, user_created = User.objects.get_or_create(
            username=provider_data['username'],
            defaults={
                'email': provider_data['email'],
                'first_name': provider_data['first_name'],
                'last_name': provider_data['last_name'],
            }
        )
        
        if user_created:
            user.set_password('password123')  # Default password
            user.save()
            print(f"✓ Created user: {user.username}")
        else:
            print(f"→ User already exists: {user.username}")
        
        # Create or update provider
        provider, provider_created = Provider.objects.get_or_create(
            user=user,
            defaults={
                'business_name': provider_data['business_name'],
                'category': categories[provider_data['category']],
                'bio': provider_data['bio'],
                'phone': provider_data['phone'],
                'address': provider_data['address'],
                'city': provider_data['city'],
                'state': provider_data['state'],
                'zip_code': provider_data['zip_code'],
                'is_verified': provider_data['is_verified'],
                'rating': Decimal('4.5'),
                'total_reviews': 10,
            }
        )
        
        if provider_created:
            print(f"  ✓ Created provider: {provider.business_name}")
        else:
            print(f"  → Provider already exists: {provider.business_name}")
        
        # Add services
        for service_data in provider_data['services']:
            service, service_created = Service.objects.get_or_create(
                provider=provider,
                name=service_data['name'],
                defaults={
                    'description': service_data['description'],
                    'price': Decimal(service_data['price']),
                }
            )
            
            if service_created:
                print(f"    ✓ Added service: {service.name} (${service.price})")
            else:
                print(f"    → Service already exists: {service.name}")
        
        print()
    
    # Print summary
    total_providers = Provider.objects.count()
    total_services = Service.objects.count()
    total_categories = Category.objects.count()
    
    print("="*50)
    print("Summary")
    print("="*50)
    print(f"Total Categories: {total_categories}")
    print(f"Total Providers: {total_providers}")
    print(f"Total Services: {total_services}")
    print("="*50)
    print("\n✅ Sample providers added successfully!")
    print("\nYou can now access the providers at:")
    print("  Frontend: http://localhost:3000/providers")
    print("  API: http://localhost:8000/api/providers/")
    print("  Admin: http://localhost:8000/admin/api/provider/")

if __name__ == '__main__':
    add_sample_providers()
