"""
Management command to populate the database with sample data for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Category, Provider, Service, Address
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Populates the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Create categories
        categories_data = [
            {'name': 'Plumbing', 'description': 'Plumbing and pipe repair services'},
            {'name': 'Electrical', 'description': 'Electrical installation and repair'},
            {'name': 'Carpentry', 'description': 'Woodworking and furniture'},
            {'name': 'Cleaning', 'description': 'Home and office cleaning services'},
            {'name': 'Landscaping', 'description': 'Garden and lawn care'},
            {'name': 'HVAC', 'description': 'Heating, ventilation, and air conditioning'},
            {'name': 'Painting', 'description': 'Interior and exterior painting'},
            {'name': 'Roofing', 'description': 'Roof repair and installation'},
        ]
        
        categories = []
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            categories.append(cat)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {cat.name}'))

        # Create sample providers (unclaimed listings)
        providers_data = [
            {
                'business_name': 'Quick Fix Plumbing',
                'description': 'Professional plumbing services for residential and commercial properties. 24/7 emergency service available.',
                'phone': '555-0101',
                'email': 'info@quickfixplumbing.com',
                'website': 'https://quickfixplumbing.com',
                'category': 'Plumbing',
                'address': {
                    'street': '123 Main St',
                    'city': 'Springfield',
                    'state': 'IL',
                    'zipcode': '62701',
                    'latitude': 39.7817,
                    'longitude': -89.6501
                }
            },
            {
                'business_name': 'Bright Spark Electrical',
                'description': 'Licensed electricians providing installation, repair, and maintenance services.',
                'phone': '555-0102',
                'email': 'contact@brightspark.com',
                'website': 'https://brightspark.com',
                'category': 'Electrical',
                'address': {
                    'street': '456 Oak Ave',
                    'city': 'Springfield',
                    'state': 'IL',
                    'zipcode': '62702',
                    'latitude': 39.7990,
                    'longitude': -89.6440
                }
            },
            {
                'business_name': 'Green Thumb Landscaping',
                'description': 'Beautiful landscapes designed and maintained by experienced professionals.',
                'phone': '555-0103',
                'email': 'info@greenthumb.com',
                'website': 'https://greenthumb.com',
                'category': 'Landscaping',
                'address': {
                    'street': '789 Pine Rd',
                    'city': 'Springfield',
                    'state': 'IL',
                    'zipcode': '62703',
                    'latitude': 39.7650,
                    'longitude': -89.6700
                }
            },
            {
                'business_name': 'Sparkle Clean Services',
                'description': 'Professional cleaning services for homes and offices. Eco-friendly products.',
                'phone': '555-0104',
                'email': 'hello@sparkleclean.com',
                'website': 'https://sparkleclean.com',
                'category': 'Cleaning',
                'address': {
                    'street': '321 Elm St',
                    'city': 'Springfield',
                    'state': 'IL',
                    'zipcode': '62701',
                    'latitude': 39.7900,
                    'longitude': -89.6550
                }
            },
            {
                'business_name': 'Master Carpenters Co',
                'description': 'Custom woodworking, furniture repair, and carpentry services.',
                'phone': '555-0105',
                'email': 'info@mastercarpenters.com',
                'website': 'https://mastercarpenters.com',
                'category': 'Carpentry',
                'address': {
                    'street': '654 Maple Dr',
                    'city': 'Springfield',
                    'state': 'IL',
                    'zipcode': '62704',
                    'latitude': 39.7750,
                    'longitude': -89.6600
                }
            },
            {
                'business_name': 'Cool Breeze HVAC',
                'description': 'Expert heating and cooling solutions. Installation, repair, and maintenance.',
                'phone': '555-0106',
                'email': 'service@coolbreeze.com',
                'website': 'https://coolbreeze.com',
                'category': 'HVAC',
                'address': {
                    'street': '987 Cedar Ln',
                    'city': 'Springfield',
                    'state': 'IL',
                    'zipcode': '62702',
                    'latitude': 39.8000,
                    'longitude': -89.6400
                }
            },
        ]

        for prov_data in providers_data:
        # Build category lookup dict
        category_map = {cat.name: cat for cat in categories}

        for prov_data in providers_data:
            category = category_map[prov_data['category']]
            # …rest of loop unchanged            
            provider, created = Provider.objects.get_or_create(
                business_name=prov_data['business_name'],
                defaults={
                    'description': prov_data['description'],
                    'phone': prov_data['phone'],
                    'email': prov_data['email'],
                    'website': prov_data['website'],
                    'is_active': True,
                    'is_claimed': False,
            if created:
                # Create address
                address_data = prov_data['address']
                Address.objects.get_or_create(
                    provider=provider,
                    defaults={
                        'street': address_data['street'],
                        'city': address_data['city'],
                        'state': address_data['state'],
                        'postal_code': address_data['zipcode'],
                        'country': 'USA',
                        'latitude': Decimal(str(address_data['latitude'])),
                        'longitude': Decimal(str(address_data['longitude'])),
                        'is_primary': True
                    }
                )
                
                # Create services
                Service.objects.get_or_create(
                    provider=provider,
                    category=category,
                    defaults={
                        'name': f'{category.name} Services',
                        'description': f'Professional {category.name.lower()} services',
                        'price': Decimal('75.00'),
                        'price_type': 'hourly',
                        'is_active': True
                    }
                )                    price_type='hourly',
                    is_active=True
                )
                
                self.stdout.write(self.style.SUCCESS(f'Created provider: {provider.business_name}'))

        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))
        self.stdout.write(f'Created {Category.objects.count()} categories')
        self.stdout.write(f'Created {Provider.objects.count()} providers')
        self.stdout.write(f'Created {Service.objects.count()} services')
