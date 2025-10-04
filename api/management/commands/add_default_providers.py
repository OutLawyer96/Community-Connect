from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Provider, Category, Service, Address
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Add 20 default providers to the database'

    def handle(self, *args, **options):
        self.stdout.write('Creating categories...')
        
        # Create categories
        categories_data = [
            'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Landscaping',
            'Cleaning', 'HVAC', 'Roofing', 'Flooring', 'Handyman',
            'Locksmith', 'Pest Control', 'Moving', 'Appliance Repair', 'Pool Service'
        ]
        
        categories = {}
        for cat_name in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_name,
                defaults={'description': f'Professional {cat_name} services'}
            )
            categories[cat_name] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {cat_name}'))

        self.stdout.write('Creating providers...')
        
        providers_data = [
            {
                'business_name': 'AAA Plumbing Experts',
                'category': 'Plumbing',
                'description': 'Professional plumbing services for residential and commercial properties. Available 24/7 for emergencies.',
                'phone': '555-0101',
                'address': '123 Main St, Cityville',
                'latitude': 40.7128,
                'longitude': -74.0060,
                'hourly_rate': '75.00',
                'years_experience': 15
            },
            {
                'business_name': 'Bright Spark Electrical',
                'category': 'Electrical',
                'description': 'Licensed electricians providing safe and reliable electrical solutions.',
                'phone': '555-0102',
                'address': '456 Oak Ave, Cityville',
                'latitude': 40.7580,
                'longitude': -73.9855,
                'hourly_rate': '85.00',
                'years_experience': 12
            },
            {
                'business_name': 'Master Carpenters Inc',
                'category': 'Carpentry',
                'description': 'Custom carpentry, furniture repair, and woodworking services.',
                'phone': '555-0103',
                'address': '789 Pine Rd, Cityville',
                'latitude': 40.7489,
                'longitude': -73.9680,
                'hourly_rate': '65.00',
                'years_experience': 20
            },
            {
                'business_name': 'Perfect Paint Pros',
                'category': 'Painting',
                'description': 'Interior and exterior painting with attention to detail.',
                'phone': '555-0104',
                'address': '321 Elm St, Cityville',
                'latitude': 40.7614,
                'longitude': -73.9776,
                'hourly_rate': '55.00',
                'years_experience': 8
            },
            {
                'business_name': 'Green Thumb Landscaping',
                'category': 'Landscaping',
                'description': 'Complete landscaping services including design, maintenance, and irrigation.',
                'phone': '555-0105',
                'address': '654 Maple Dr, Cityville',
                'latitude': 40.7500,
                'longitude': -73.9900,
                'hourly_rate': '60.00',
                'years_experience': 10
            },
            {
                'business_name': 'Sparkle Clean Services',
                'category': 'Cleaning',
                'description': 'Professional residential and commercial cleaning services.',
                'phone': '555-0106',
                'address': '987 Cedar Ln, Cityville',
                'latitude': 40.7300,
                'longitude': -74.0000,
                'hourly_rate': '45.00',
                'years_experience': 5
            },
            {
                'business_name': 'Cool Comfort HVAC',
                'category': 'HVAC',
                'description': 'Heating, ventilation, and air conditioning installation and repair.',
                'phone': '555-0107',
                'address': '147 Birch Ave, Cityville',
                'latitude': 40.7400,
                'longitude': -73.9950,
                'hourly_rate': '90.00',
                'years_experience': 18
            },
            {
                'business_name': 'Top Tier Roofing',
                'category': 'Roofing',
                'description': 'Expert roofing installation, repair, and maintenance.',
                'phone': '555-0108',
                'address': '258 Spruce St, Cityville',
                'latitude': 40.7350,
                'longitude': -74.0100,
                'hourly_rate': '80.00',
                'years_experience': 22
            },
            {
                'business_name': 'Premium Floors Plus',
                'category': 'Flooring',
                'description': 'Hardwood, tile, carpet, and laminate flooring installation.',
                'phone': '555-0109',
                'address': '369 Willow Way, Cityville',
                'latitude': 40.7200,
                'longitude': -73.9800,
                'hourly_rate': '70.00',
                'years_experience': 14
            },
            {
                'business_name': 'Handy Helper Services',
                'category': 'Handyman',
                'description': 'General handyman services for all your home repair needs.',
                'phone': '555-0110',
                'address': '741 Ash Blvd, Cityville',
                'latitude': 40.7450,
                'longitude': -74.0050,
                'hourly_rate': '50.00',
                'years_experience': 7
            },
            {
                'business_name': 'Swift Lock Solutions',
                'category': 'Locksmith',
                'description': '24/7 emergency locksmith services for homes and vehicles.',
                'phone': '555-0111',
                'address': '852 Cherry Ct, Cityville',
                'latitude': 40.7550,
                'longitude': -73.9700,
                'hourly_rate': '65.00',
                'years_experience': 11
            },
            {
                'business_name': 'Bug Busters Pest Control',
                'category': 'Pest Control',
                'description': 'Effective and eco-friendly pest control solutions.',
                'phone': '555-0112',
                'address': '963 Poplar Pl, Cityville',
                'latitude': 40.7250,
                'longitude': -73.9850,
                'hourly_rate': '55.00',
                'years_experience': 9
            },
            {
                'business_name': 'Smooth Movers LLC',
                'category': 'Moving',
                'description': 'Professional moving services for local and long-distance relocations.',
                'phone': '555-0113',
                'address': '159 Hickory Hill, Cityville',
                'latitude': 40.7600,
                'longitude': -74.0150,
                'hourly_rate': '100.00',
                'years_experience': 6
            },
            {
                'business_name': 'Fix-It Fast Appliance Repair',
                'category': 'Appliance Repair',
                'description': 'Expert repair for all major appliances and brands.',
                'phone': '555-0114',
                'address': '357 Beech St, Cityville',
                'latitude': 40.7150,
                'longitude': -73.9750,
                'hourly_rate': '75.00',
                'years_experience': 13
            },
            {
                'business_name': 'Crystal Clear Pool Service',
                'category': 'Pool Service',
                'description': 'Complete pool maintenance, cleaning, and repair services.',
                'phone': '555-0115',
                'address': '486 Sycamore Dr, Cityville',
                'latitude': 40.7320,
                'longitude': -74.0080,
                'hourly_rate': '60.00',
                'years_experience': 8
            },
            {
                'business_name': 'Elite Plumbing Solutions',
                'category': 'Plumbing',
                'description': 'High-quality plumbing repairs and installations.',
                'phone': '555-0116',
                'address': '753 Magnolia Ave, Cityville',
                'latitude': 40.7420,
                'longitude': -73.9920,
                'hourly_rate': '80.00',
                'years_experience': 17
            },
            {
                'business_name': 'PowerUp Electrical Services',
                'category': 'Electrical',
                'description': 'Commercial and residential electrical work with guaranteed quality.',
                'phone': '555-0117',
                'address': '951 Dogwood Ln, Cityville',
                'latitude': 40.7280,
                'longitude': -73.9880,
                'hourly_rate': '88.00',
                'years_experience': 16
            },
            {
                'business_name': 'Artisan Painters',
                'category': 'Painting',
                'description': 'Professional painters specializing in residential projects.',
                'phone': '555-0118',
                'address': '842 Redwood Rd, Cityville',
                'latitude': 40.7380,
                'longitude': -74.0020,
                'hourly_rate': '58.00',
                'years_experience': 10
            },
            {
                'business_name': 'Nature\'s Best Landscaping',
                'category': 'Landscaping',
                'description': 'Award-winning landscape design and maintenance services.',
                'phone': '555-0119',
                'address': '531 Fir Forest Way, Cityville',
                'latitude': 40.7480,
                'longitude': -73.9820,
                'hourly_rate': '65.00',
                'years_experience': 12
            },
            {
                'business_name': 'Total Clean Solutions',
                'category': 'Cleaning',
                'description': 'Deep cleaning specialists for homes and offices.',
                'phone': '555-0120',
                'address': '624 Laurel Loop, Cityville',
                'latitude': 40.7220,
                'longitude': -73.9780,
                'hourly_rate': '48.00',
                'years_experience': 6
            },
        ]

        created_count = 0
        for provider_data in providers_data:
            # Create or get user for provider
            username = provider_data['business_name'].lower().replace(' ', '_').replace("'", '')
            email = f"{username}@example.com"
            
            user, user_created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': provider_data['business_name'].split()[0],
                    'last_name': 'Provider'
                }
            )
            
            if user_created:
                user.set_password('provider123')  # Default password
                user.save()

            # Create provider
            provider, created = Provider.objects.get_or_create(
                user=user,
                defaults={
                    'business_name': provider_data['business_name'],
                    'description': provider_data['description'],
                    'phone': provider_data['phone'],
                    'email': email,
                    'is_verified': True,
                    'is_claimed': True,
                    'is_active': True,
                }
            )

            if created:
                # Create address
                Address.objects.get_or_create(
                    provider=provider,
                    is_primary=True,
                    defaults={
                        'street': provider_data['address'].split(',')[0],
                        'city': provider_data['address'].split(',')[1].strip() if ',' in provider_data['address'] else 'Cityville',
                        'state': 'NY',
                        'postal_code': '10001',
                        'country': 'United States',
                        'latitude': Decimal(str(provider_data['latitude'])),
                        'longitude': Decimal(str(provider_data['longitude'])),
                    }
                )
                
                # Get category for the service
                category = categories[provider_data['category']]
                
                # Create a sample service with category
                Service.objects.get_or_create(
                    provider=provider,
                    name=f"{provider_data['category']} Service",
                    defaults={
                        'category': category,
                        'description': f"Professional {provider_data['category'].lower()} service",
                        'price': Decimal(provider_data['hourly_rate']),
                        'price_type': 'hourly',
                        'is_active': True,
                    }
                )
                
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created provider: {provider_data["business_name"]}'))
            else:
                self.stdout.write(self.style.WARNING(f'Provider already exists: {provider_data["business_name"]}'))

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {created_count} providers!'))
        self.stdout.write(self.style.SUCCESS('Default password for all providers: provider123'))
