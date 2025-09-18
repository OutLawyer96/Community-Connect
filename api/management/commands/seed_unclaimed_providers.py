"""
Management command to create unclaimed provider listings for testing the claim system.
This command creates provider listings without associated user accounts to simulate
businesses that need to be claimed by their owners.

Usage:
    python manage.py seed_unclaimed_providers --count 20
    python manage.py seed_unclaimed_providers --clear  # Clear existing unclaimed providers
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Provider, Category, Address, Service
import random


class Command(BaseCommand):
    help = 'Seed database with unclaimed provider listings for claim system testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of unclaimed providers to create (default: 10)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing unclaimed providers before seeding',
        )
        parser.add_argument(
            '--mark-existing',
            action='store_true',
            help='Mark existing providers as unclaimed instead of creating new ones',
        )

    def handle(self, *args, **options):
        count = options['count']
        clear = options['clear']
        mark_existing = options['mark_existing']

        with transaction.atomic():
            if clear:
                self.clear_unclaimed_providers()

            if mark_existing:
                self.mark_existing_providers_unclaimed(count)
            else:
                self.create_unclaimed_providers(count)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded {count} unclaimed provider listings!'
            )
        )

    def clear_unclaimed_providers(self):
        """Remove all unclaimed providers from the database"""
        unclaimed_count = Provider.objects.filter(is_claimed=False).count()
        Provider.objects.filter(is_claimed=False).delete()
        
        self.stdout.write(
            self.style.WARNING(f'Cleared {unclaimed_count} unclaimed providers')
        )

    def mark_existing_providers_unclaimed(self, count):
        """Mark existing claimed providers as unclaimed for testing"""
        claimed_providers = Provider.objects.filter(is_claimed=True)[:count]
        updated_count = 0
        
        for provider in claimed_providers:
            provider.is_claimed = False
            provider.save()
            updated_count += 1
            
            self.stdout.write(f'Marked {provider.business_name} as unclaimed')

        self.stdout.write(
            self.style.SUCCESS(f'Marked {updated_count} existing providers as unclaimed')
        )

    def create_unclaimed_providers(self, count):
        """Create new unclaimed provider listings"""
        # Check if Provider model supports nullable user field
        try:
            test_provider = Provider._meta.get_field('user')
            if not test_provider.null:
                self.stdout.write(
                    self.style.ERROR('Provider model does not support nullable user field. Please run migrations first.')
                )
                return
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error checking Provider model: {e}')
            )
            return
            
        # Sample business data for unclaimed providers
        business_names = [
            "Local Coffee Corner", "Quick Fix Auto Repair", "Sunshine Bakery",
            "Green Thumb Landscaping", "City Dental Care", "Express Dry Cleaning",
            "Friendly Pet Grooming", "Home Sweet Cleaning", "Tech Repair Hub",
            "Fresh Market Groceries", "Cozy Hair Salon", "Reliable Plumbing",
            "Tasty Pizza Palace", "Professional Tax Services", "Fitness First Gym",
            "Creative Photography", "Healthy Juice Bar", "Quality Shoes Store",
            "Modern Interior Design", "24/7 Pharmacy", "Budget Moving Services",
            "Elite Tutoring Center", "Organic Farm Stand", "Downtown Barber Shop",
            "Smart Phone Repair", "Luxury Spa Services", "Affordable Legal Aid",
            "Express Courier Service", "Custom Printing Shop", "Vintage Clothing"
        ]
        
        descriptions = [
            "Serving the community with quality products and excellent service for over 10 years.",
            "Family-owned business committed to providing affordable and reliable services.",
            "Professional team dedicated to meeting all your needs with a personal touch.",
            "Locally operated with a focus on customer satisfaction and quality workmanship.",
            "Experienced professionals offering competitive prices and timely service.",
            "Trusted by the community for honest, dependable service since establishment.",
            "Specializing in personalized service with attention to detail and quality.",
            "Friendly staff ready to help with all your requirements and special requests."
        ]

        cities = [
            "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
            "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
            "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara"
        ]

        states = [
            "Maharashtra", "Delhi", "Karnataka", "Telangana", "Tamil Nadu",
            "West Bengal", "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh",
            "Andhra Pradesh", "Bihar"
        ]

        # Get available categories
        categories = list(Category.objects.all())
        if not categories:
            self.stdout.write(
                self.style.ERROR('No categories found. Please seed categories first.')
            )
            return

        created_count = 0
        for i in range(count):
            # Create unclaimed provider
            business_name = f"{random.choice(business_names)} - {random.choice(cities)}"
            
            # Check if business name already exists
            if Provider.objects.filter(business_name=business_name).exists():
                business_name = f"{business_name} #{i+1}"

            provider = Provider.objects.create(
                user=None,  # No user account - this makes it unclaimed
                business_name=business_name,
                description=random.choice(descriptions),
                phone=f"+91-{random.randint(7000000000, 9999999999)}",
                email=f"contact@{business_name.lower().replace(' ', '').replace('-', '')[:20]}.com",
                website=f"https://www.{business_name.lower().replace(' ', '').replace('-', '')[:20]}.com",
                is_claimed=False,
                is_verified=False,
                is_active=True
            )

            # Add address
            city = random.choice(cities)
            state = random.choice(states)
            
            address = Address.objects.create(
                provider=provider,
                street=f"{random.randint(1, 999)} {random.choice(['Main St', 'Market Rd', 'Commercial Ave', 'Business Blvd'])}",
                city=city,
                state=state,
                postal_code=f"{random.randint(100000, 999999)}",
                latitude=random.uniform(8.0, 37.0),  # India's latitude range
                longitude=random.uniform(68.0, 97.0)  # India's longitude range
            )

            # Add services
            category = random.choice(categories)
            service_names = [
                f"{category.name} Service",
                f"Professional {category.name}",
                f"Quality {category.name} Solutions"
            ]

            for j in range(random.randint(1, 3)):
                Service.objects.create(
                    provider=provider,
                    category=category,
                    name=f"{random.choice(service_names)} {j+1}",
                    description=f"High-quality {category.name.lower()} service with competitive pricing.",
                    price=random.uniform(500.0, 5000.0),
                    price_type=random.choice(['fixed', 'hourly', 'quote'])
                )

            created_count += 1
            self.stdout.write(f'Created unclaimed provider: {provider.business_name}')

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} new unclaimed providers')
        )

    def get_sample_data(self):
        """Return sample data for creating providers"""
        return {
            'business_names': [
                # Add more business names here
            ],
            'descriptions': [
                # Add more descriptions here
            ]
        }