import random
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker
from api.models import User, Provider, Address, Category, Service, Review
from api.config import DataConfig, LocationConfig, BusinessConfig

# Indian cities with coordinates and states - use the extended list from configuration
INDIAN_CITIES = [
    {'name': 'Mumbai', 'state': 'Maharashtra', 'lat': 19.0760, 'lng': 72.8777, 'pin': '400001'},
    {'name': 'Delhi', 'state': 'Delhi', 'lat': 28.7041, 'lng': 77.1025, 'pin': '110001'},
    {'name': 'Bangalore', 'state': 'Karnataka', 'lat': 12.9716, 'lng': 77.5946, 'pin': '560001'},
    {'name': 'Hyderabad', 'state': 'Telangana', 'lat': 17.3850, 'lng': 78.4867, 'pin': '500001'},
    {'name': 'Ahmedabad', 'state': 'Gujarat', 'lat': 23.0225, 'lng': 72.5714, 'pin': '380001'},
    {'name': 'Chennai', 'state': 'Tamil Nadu', 'lat': 13.0827, 'lng': 80.2707, 'pin': '600001'},
    {'name': 'Kolkata', 'state': 'West Bengal', 'lat': 22.5726, 'lng': 88.3639, 'pin': '700001'},
    {'name': 'Pune', 'state': 'Maharashtra', 'lat': 18.5204, 'lng': 73.8567, 'pin': '411001'},
    {'name': 'Jaipur', 'state': 'Rajasthan', 'lat': 26.9124, 'lng': 75.7873, 'pin': '302001'},
    {'name': 'Surat', 'state': 'Gujarat', 'lat': 21.1702, 'lng': 72.8311, 'pin': '395001'},
    {'name': 'Lucknow', 'state': 'Uttar Pradesh', 'lat': 26.8467, 'lng': 80.9462, 'pin': '226001'},
    {'name': 'Kanpur', 'state': 'Uttar Pradesh', 'lat': 26.4499, 'lng': 80.3319, 'pin': '208001'},
    {'name': 'Nagpur', 'state': 'Maharashtra', 'lat': 21.1458, 'lng': 79.0882, 'pin': '440001'},
    {'name': 'Indore', 'state': 'Madhya Pradesh', 'lat': 22.7196, 'lng': 75.8577, 'pin': '452001'},
    {'name': 'Thane', 'state': 'Maharashtra', 'lat': 19.2183, 'lng': 72.9781, 'pin': '400601'},
    {'name': 'Bhopal', 'state': 'Madhya Pradesh', 'lat': 23.2599, 'lng': 77.4126, 'pin': '462001'},
    {'name': 'Visakhapatnam', 'state': 'Andhra Pradesh', 'lat': 17.6868, 'lng': 83.2185, 'pin': '530001'},
    {'name': 'Pimpri-Chinchwad', 'state': 'Maharashtra', 'lat': 18.6298, 'lng': 73.7997, 'pin': '411017'},
    {'name': 'Patna', 'state': 'Bihar', 'lat': 25.5941, 'lng': 85.1376, 'pin': '800001'},
    {'name': 'Vadodara', 'state': 'Gujarat', 'lat': 22.3072, 'lng': 73.1812, 'pin': '390001'},
]

# Indian first names by region
INDIAN_FIRST_NAMES = {
    'North': ['Raj', 'Priya', 'Amit', 'Neha', 'Vikram', 'Pooja', 'Rahul', 'Anita', 'Suresh', 'Kavita', 'Manoj', 'Sunita', 'Ajay', 'Meera', 'Ravi'],
    'South': ['Karthik', 'Lakshmi', 'Suresh', 'Priya', 'Rajesh', 'Deepika', 'Venkat', 'Sita', 'Arun', 'Divya', 'Krishna', 'Radha', 'Mahesh', 'Sowmya'],
    'West': ['Nikhil', 'Shruti', 'Rohit', 'Pallavi', 'Kiran', 'Swati', 'Sagar', 'Vaishali', 'Akash', 'Ashwini', 'Prasad', 'Manasi', 'Sachin', 'Sneha'],
    'East': ['Subhash', 'Ruma', 'Tapan', 'Mousumi', 'Debashis', 'Aparna', 'Sandip', 'Madhuri', 'Biswas', 'Sharmila', 'Prokash', 'Jayanti']
}

# Indian last names by region
INDIAN_LAST_NAMES = {
    'North': ['Sharma', 'Gupta', 'Agarwal', 'Singh', 'Kumar', 'Verma', 'Aggarwal', 'Jain', 'Bansal', 'Mittal'],
    'South': ['Reddy', 'Nair', 'Iyer', 'Rao', 'Krishnan', 'Murugan', 'Pillai', 'Menon', 'Srinivasan', 'Raman'],
    'West': ['Patel', 'Shah', 'Modi', 'Joshi', 'Desai', 'Mehta', 'Trivedi', 'Vyas', 'Parikh', 'Thakkar'],
    'East': ['Banerjee', 'Mukherjee', 'Chatterjee', 'Ghosh', 'Roy', 'Das', 'Bose', 'Sen', 'Dutta', 'Chakraborty']
}

def get_region_for_state(state):
    """Get region based on Indian state"""
    north_states = ['Delhi', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Rajasthan']
    south_states = ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Kerala']
    west_states = ['Maharashtra', 'Gujarat', 'Goa', 'Madhya Pradesh']
    east_states = ['West Bengal', 'Bihar', 'Jharkhand', 'Odisha', 'Assam']
    
    if state in north_states:
        return 'North'
    elif state in south_states:
        return 'South'
    elif state in west_states:
        return 'West'
    elif state in east_states:
        return 'East'
    else:
        return 'North'  # Default

# Regional business types and descriptions for Indian context
REGIONAL_BUSINESSES = {
    'North': {
        'Restaurant': [
            'Authentic North Indian cuisine with tandoor specialties and traditional recipes.',
            'Family restaurant serving fresh rotis, dal makhani, and Punjabi dishes.',
            'Multi-cuisine restaurant with North Indian, Chinese, and Continental food.'
        ],
        'Salon': [
            'Professional hair styling and beauty services for men and women.',
            'Modern salon offering hair cuts, facials, and bridal makeup services.',
            'Unisex salon with latest hair treatments and beauty care.'
        ],
        'Electronics': [
            'Complete range of electronics, mobile phones, and home appliances.',
            'Authorized dealer for Samsung, LG, and other leading brands.',
            'Electronics repair and sales with genuine spare parts.'
        ],
        'Tailoring': [
            'Custom tailoring for suits, shirts, and traditional Indian wear.',
            'Professional stitching services for all types of garments.',
            'Designer boutique specializing in wedding and party wear.'
        ],
        'Medical': [
            'General physician with 24/7 emergency services available.',
            'Multi-specialty clinic with experienced doctors and modern equipment.',
            'Pharmacy and medical store with wide range of medicines.'
        ]
    },
    'South': {
        'Restaurant': [
            'Authentic South Indian breakfast with dosa, idli, and filter coffee.',
            'Traditional vegetarian meals served on banana leaf.',
            'Multi-cuisine restaurant with South Indian, North Indian specialties.'
        ],
        'Salon': [
            'Traditional beauty treatments with herbal and ayurvedic products.',
            'Modern salon services with hair spa and skin care treatments.',
            'Bridal makeup specialist with traditional South Indian styles.'
        ],
        'Electronics': [
            'Latest gadgets, smartphones, and electronic accessories.',
            'Authorized service center for major electronics brands.',
            'Home appliances and electronics with installation services.'
        ],
        'Tailoring': [
            'Custom stitching for sarees, salwar suits, and formal wear.',
            'Traditional South Indian wedding dress specialist.',
            'Modern fashion designing and alteration services.'
        ],
        'Medical': [
            'Ayurvedic treatment center with traditional healing methods.',
            'General practice clinic with pediatric and dental services.',
            'Medical store with ayurvedic and allopathic medicines.'
        ]
    },
    'West': {
        'Restaurant': [
            'Gujarati thali restaurant with unlimited traditional food.',
            'Multi-cuisine dining with Gujarati, Rajasthani, and Punjabi dishes.',
            'Fast food center with street food and regional specialties.'
        ],
        'Salon': [
            'Premium beauty salon with international styling techniques.',
            'Hair and beauty services with latest trends and treatments.',
            'Luxury spa and salon with wellness treatments.'
        ],
        'Electronics': [
            'Electronics superstore with competitive prices and warranties.',
            'Mobile phone dealer with all leading brands and accessories.',
            'Computer hardware and software solutions provider.'
        ],
        'Tailoring': [
            'Designer boutique specializing in ethnic and western wear.',
            'Custom tailoring for business suits and formal attire.',
            'Traditional Gujarati and Rajasthani dress specialist.'
        ],
        'Medical': [
            'Multi-specialty hospital with 24/7 emergency services.',
            'Family health clinic with general and specialist doctors.',
            'Diagnostic center with pathology and imaging services.'
        ]
    },
    'East': {
        'Restaurant': [
            'Bengali cuisine specialist with fish curry and sweets.',
            'Traditional dhaba serving authentic regional food.',
            'Multi-cuisine restaurant with Bengali, Chinese, and Mughlai dishes.'
        ],
        'Salon': [
            'Beauty parlor with traditional and modern styling services.',
            'Hair salon specializing in ethnic hairstyles and treatments.',
            'Bridal makeup with Bengali traditional looks.'
        ],
        'Electronics': [
            'Electronics and mobile phone repair specialist.',
            'Authorized dealer for consumer electronics and appliances.',
            'Computer sales and service with technical support.'
        ],
        'Tailoring': [
            'Custom tailoring for traditional Bengali wear and sarees.',
            'Modern fashion boutique with designer collections.',
            'Alteration and stitching services for all garments.'
        ],
        'Medical': [
            'General physician with experience in family medicine.',
            'Homeopathic treatment center with natural healing.',
            'Medical clinic with pathology lab and pharmacy.'
        ]
    },
    'Central': {
        'Restaurant': [
            'Traditional restaurant serving regional Madhya Pradesh cuisine.',
            'Family dining with vegetarian and non-vegetarian options.',
            'Highway dhaba with authentic Indian truck driver food.'
        ],
        'Salon': [
            'Local beauty parlor with affordable hair and beauty services.',
            'Modern salon with hair cutting, styling, and facial treatments.',
            'Unisex salon serving rural and urban clientele.'
        ],
        'Electronics': [
            'Local electronics shop with mobiles, accessories, and repairs.',
            'TV, radio, and home appliance sales and service center.',
            'Electronics dealer with installment payment options.'
        ],
        'Tailoring': [
            'Village tailor specializing in traditional and modern clothes.',
            'Custom stitching for school uniforms and office wear.',
            'Local boutique with affordable fashion and alterations.'
        ],
        'Medical': [
            'Rural health clinic serving local community needs.',
            'General practitioner with basic medical facilities.',
            'Village pharmacy with essential medicines and first aid.'
        ]
    }
}

class Command(BaseCommand):
    help = f'Seeds the database with {DataConfig.NUM_PROVIDERS} providers and realistic data for performance testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--providers',
            type=int,
            default=DataConfig.NUM_PROVIDERS,
            help=f'Number of providers to create (default: {DataConfig.NUM_PROVIDERS})'
        )
        parser.add_argument(
            '--customers',
            type=int,
            default=DataConfig.NUM_CUSTOMERS,
            help=f'Number of customers to create (default: {DataConfig.NUM_CUSTOMERS})'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding'
        )

    def handle(self, *args, **options):
        num_providers = options['providers']
        num_customers = options['customers']
        
        self.stdout.write(f'🚀 Preparing to seed {num_providers} providers and {num_customers} customers...')
        
        # Use multiple locales for diverse data
        fake = Faker(['en_US', 'en_GB', 'en_CA', 'en_AU'])
        
        # Business type generators for realistic names
        business_types = [
            'Services', 'Solutions', 'Pro', 'Expert', 'Plus', 'Elite', 'Prime', 
            'Express', 'Quick', 'Reliable', 'Professional', 'Quality', 'Best',
            'Advanced', 'Superior', 'Premium', 'Specialist', 'Master', 'Tech'
        ]
        
        service_categories = [
            'Repair', 'Installation', 'Maintenance', 'Consultation', 'Design',
            'Emergency', 'Inspection', 'Cleaning', 'Upgrade', 'Custom'
        ]

        if options['clear']:
            # --- Clean Up Existing Data ---
            self.stdout.write('🧹 Clearing existing data...')
            Review.objects.all().delete()
            Service.objects.all().delete()
            Address.objects.all().delete()
            Provider.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            # Keep existing categories or create fresh ones
            Category.objects.all().delete()

        # --- Create Categories ---
        self.stdout.write('📂 Creating service categories...')
        categories_data = [
            {'name': 'Home Services', 'description': 'Services for home maintenance and improvement'},
            {'name': 'Professional Services', 'description': 'Business and professional services'},
            {'name': 'Personal Care', 'description': 'Health and beauty services'},
            {'name': 'Automotive', 'description': 'Car repair and maintenance services'},
            {'name': 'Technology', 'description': 'IT and technology services'},
            {'name': 'Education', 'description': 'Tutoring and educational services'},
            {'name': 'Health & Wellness', 'description': 'Healthcare and wellness services'},
            {'name': 'Food & Catering', 'description': 'Food service and catering'},
            {'name': 'Creative Services', 'description': 'Design, photography, and creative work'},
            {'name': 'Fitness & Sports', 'description': 'Personal training and sports instruction'}
        ]
        
        categories_to_create = []
        for cat_data in categories_data:
            category = Category(
                name=cat_data['name'],
                description=cat_data['description'],
                is_active=True
            )
            categories_to_create.append(category)
        
        Category.objects.bulk_create(categories_to_create, ignore_conflicts=True)
        
        # Create subcategories
        main_categories = Category.objects.filter(parent_category__isnull=True)
        subcategories_data = {
            'Home Services': ['Plumbing', 'Electrical', 'HVAC', 'Landscaping', 'Cleaning', 'Painting'],
            'Professional Services': ['Legal', 'Accounting', 'Marketing', 'Consulting', 'Translation'],
            'Personal Care': ['Beauty Salon', 'Barbershop', 'Massage Therapy', 'Nail Care'],
            'Automotive': ['Auto Repair', 'Oil Change', 'Tire Service', 'Detailing'],
            'Technology': ['Computer Repair', 'Web Development', 'IT Support', 'Phone Repair'],
            'Education': ['Math Tutoring', 'Language Learning', 'Music Lessons', 'Test Prep'],
            'Health & Wellness': ['Physical Therapy', 'Nutrition', 'Mental Health', 'Alternative Medicine'],
            'Food & Catering': ['Catering', 'Personal Chef', 'Meal Prep', 'Baking'],
            'Creative Services': ['Photography', 'Graphic Design', 'Video Production', 'Writing'],
            'Fitness & Sports': ['Personal Training', 'Yoga', 'Martial Arts', 'Sports Coaching']
        }
        
        subcategories_to_create = []
        for main_cat in main_categories:
            if main_cat.name in subcategories_data:
                for sub_name in subcategories_data[main_cat.name]:
                    subcategory = Category(
                        name=sub_name,
                        parent_category=main_cat,
                        description=f"{sub_name} services under {main_cat.name}",
                        is_active=True
                    )
                    subcategories_to_create.append(subcategory)
        
        Category.objects.bulk_create(subcategories_to_create, ignore_conflicts=True)
        all_categories = list(Category.objects.all())

        # --- Bulk Create Provider Users ---
        self.stdout.write(f'👥 Creating {num_providers} provider users with Indian names...')
        provider_users_to_create = []
        used_usernames = set()
        
        for _ in range(num_providers):
            # Select random Indian city
            city_data = random.choice(INDIAN_CITIES)
            region = get_region_for_state(city_data['state'])
            
            # Generate Indian names based on region
            first_name = random.choice(INDIAN_FIRST_NAMES[region])
            last_name = random.choice(INDIAN_LAST_NAMES[region])
            
            # Generate unique username
            while True:
                business_type = random.choice(business_types)
                username = f"{first_name.lower()}_{last_name.lower()}_{city_data['name'].lower().replace('-', '').replace(' ', '')}_{random.randint(100, 999)}"
                if username not in used_usernames and len(username) <= 150:
                    used_usernames.add(username)
                    break
            
            # Generate Indian phone number
            indian_phone = f"+91-{random.randint(7000000000, 9999999999)}"
            
            user = User(
                username=username,
                password=make_password('provider123'),
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}@{random.choice(['gmail.com', 'yahoo.co.in', 'rediffmail.com', 'hotmail.com'])}",
                role='provider',
                phone=indian_phone,
            )
            provider_users_to_create.append(user)
        
        User.objects.bulk_create(provider_users_to_create, batch_size=100)

        # --- Bulk Create Customer Users ---
        self.stdout.write(f'👤 Creating {num_customers} customer users...')
        customer_users_to_create = []
        
        for _ in range(num_customers):
            while True:
                username = fake.unique.user_name()
                if len(username) <= 150:  # Django username max length
                    break
            
            user = User(
                username=username,
                password=make_password('customer123'),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                email=fake.unique.email(),
                role='customer',
                phone=fake.phone_number()[:20],
            )
            customer_users_to_create.append(user)
        
        User.objects.bulk_create(customer_users_to_create, batch_size=100)

        # --- Bulk Create Providers ---
        self.stdout.write('🏢 Creating provider profiles with Indian businesses...')
        provider_users = User.objects.filter(role='provider', is_superuser=False)
        providers_to_create = []
        
        for user in provider_users:
            # Select random Indian city
            city_data = random.choice(INDIAN_CITIES)
            region = get_region_for_state(city_data['state'])
            city = city_data['name']
            
            # Get regional business type
            business_type = random.choice(list(REGIONAL_BUSINESSES[region].keys()))
            base_business_desc = random.choice(REGIONAL_BUSINESSES[region][business_type])
            
            # Generate Indian business names
            first_name = user.first_name
            last_name = user.last_name
            
            # Create comprehensive provider description
            years_in_business = random.randint(2, 25)
            specializations = {
                'Restaurant': ['vegetarian cuisine', 'non-vegetarian specialties', 'catering services', 'home delivery', 'party orders', 'traditional recipes', 'modern fusion', 'health-conscious meals'],
                'Salon': ['hair cutting and styling', 'bridal makeup', 'facial treatments', 'hair spa services', 'manicure and pedicure', 'eyebrow threading', 'hair coloring', 'anti-aging treatments'],
                'Electronics': ['mobile phone repair', 'laptop servicing', 'home appliance installation', 'warranty services', 'accessories sales', 'data recovery', 'screen replacement', 'software troubleshooting'],
                'Tailoring': ['custom stitching', 'alteration services', 'designer wear', 'wedding outfits', 'formal suits', 'traditional wear', 'quick turnaround', 'fabric consultation'],
                'Medical': ['general consultation', 'preventive care', 'emergency services', 'health checkups', 'prescription services', 'medical certificates', 'vaccination', 'chronic disease management']
            }
            
            certifications = {
                'Restaurant': ['FSSAI licensed', 'hygiene certified', 'ISO certified kitchen'],
                'Salon': ['certified beautician', 'professional training completed', 'branded product expertise'],
                'Electronics': ['authorized service center', 'technical certification', 'brand partnership'],
                'Tailoring': ['fashion design diploma', 'tailoring certification', 'pattern making expertise'],
                'Medical': ['MBBS qualified', 'registered practitioner', 'continuing education certified']
            }
            
            service_highlights = {
                'Restaurant': ['fresh ingredients daily', 'hygienic preparation', 'affordable pricing', 'quick service', 'customer satisfaction guaranteed'],
                'Salon': ['experienced professionals', 'quality products used', 'clean and sanitized tools', 'personalized service', 'latest trends'],
                'Electronics': ['genuine spare parts', 'warranty on repairs', 'quick diagnosis', 'affordable rates', 'doorstep service available'],
                'Tailoring': ['perfect fitting guaranteed', 'quality fabric selection', 'timely delivery', 'reasonable pricing', 'latest fashion styles'],
                'Medical': ['patient-centric care', 'modern equipment', 'affordable consultation', 'follow-up care', 'emergency availability']
            }
            
            # Build comprehensive description
            selected_specializations = random.sample(specializations.get(business_type, ['general services']), min(3, len(specializations.get(business_type, ['general services']))))
            selected_certification = random.choice(certifications.get(business_type, ['professionally qualified']))
            selected_highlights = random.sample(service_highlights.get(business_type, ['quality service']), min(3, len(service_highlights.get(business_type, ['quality service']))))
            
            # Create detailed description with Indian context
            detailed_description = f"{base_business_desc}\n\n"
            detailed_description += f"With {years_in_business} years of experience serving {city} and surrounding areas, "
            detailed_description += f"we are {selected_certification} and committed to excellence. "
            detailed_description += f"Our specializations include: {', '.join(selected_specializations)}.\n\n"
            detailed_description += f"Why choose us?\n"
            for i, highlight in enumerate(selected_highlights, 1):
                detailed_description += f"• {highlight.capitalize()}\n"
            detailed_description += f"\nWe understand the local community needs and provide culturally appropriate services. "
            detailed_description += f"Customer satisfaction is our top priority, and we maintain the highest standards of quality and professionalism."
            
            business_name_options = [
                f"{first_name} {business_type} Services",
                f"Sri {first_name} {business_type}",
                f"{last_name} & Sons {business_type}",
                f"New {city} {business_type}",
                f"{city} {business_type} Centre",
                f"Modern {business_type} Solutions",
                f"{first_name} Professional {business_type}",
                f"Elite {business_type} by {first_name}"
            ]
            
            provider = Provider(
                user=user,
                business_name=random.choice(business_name_options),
                description=detailed_description,
                phone=user.phone,
                email=user.email,
                website=f"https://www.{user.username.replace('_', '')}.in" if random.choice([True, False]) else '',
                is_active=True
            )
            providers_to_create.append(provider)
        
        Provider.objects.bulk_create(providers_to_create, batch_size=100)

        # --- Bulk Create Addresses ---
        self.stdout.write('📍 Creating business addresses...')
        providers = Provider.objects.all()
        addresses_to_create = []
        
        # Indian cities with their coordinates
        indian_cities = [
            {'city': 'Mumbai', 'state': 'Maharashtra', 'lat_range': (19.0176, 19.2544), 'lng_range': (72.7831, 73.0648)},
            {'city': 'Delhi', 'state': 'Delhi', 'lat_range': (28.4089, 28.8842), 'lng_range': (76.8380, 77.3466)},
            {'city': 'Bangalore', 'state': 'Karnataka', 'lat_range': (12.8342, 13.1436), 'lng_range': (77.4601, 77.7840)},
            {'city': 'Chennai', 'state': 'Tamil Nadu', 'lat_range': (12.8342, 13.2846), 'lng_range': (80.0955, 80.3242)},
            {'city': 'Hyderabad', 'state': 'Telangana', 'lat_range': (17.2403, 17.5447), 'lng_range': (78.2579, 78.6677)},
            {'city': 'Pune', 'state': 'Maharashtra', 'lat_range': (18.4088, 18.6298), 'lng_range': (73.7004, 73.9997)},
            {'city': 'Kolkata', 'state': 'West Bengal', 'lat_range': (22.4697, 22.6757), 'lng_range': (88.2646, 88.4341)},
            {'city': 'Ahmedabad', 'state': 'Gujarat', 'lat_range': (22.9734, 23.1644), 'lng_range': (72.4710, 72.6577)},
            {'city': 'Jaipur', 'state': 'Rajasthan', 'lat_range': (26.8206, 27.0238), 'lng_range': (75.6897, 75.8648)},
            {'city': 'Lucknow', 'state': 'Uttar Pradesh', 'lat_range': (26.7606, 26.9124), 'lng_range': (80.8776, 81.0594)},
            {'city': 'Kochi', 'state': 'Kerala', 'lat_range': (9.8312, 10.0889), 'lng_range': (76.2144, 76.3212)},
            {'city': 'Coimbatore', 'state': 'Tamil Nadu', 'lat_range': (10.9601, 11.0768), 'lng_range': (76.9211, 77.0624)},
            {'city': 'Indore', 'state': 'Madhya Pradesh', 'lat_range': (22.6708, 22.7759), 'lng_range': (75.7333, 75.9063)},
            {'city': 'Bhopal', 'state': 'Madhya Pradesh', 'lat_range': (23.1765, 23.3252), 'lng_range': (77.3200, 77.5134)},
            {'city': 'Chandigarh', 'state': 'Punjab', 'lat_range': (30.6942, 30.7783), 'lng_range': (76.7344, 76.8094)},
            {'city': 'Goa', 'state': 'Goa', 'lat_range': (15.2993, 15.5149), 'lng_range': (73.8278, 74.1240)},
            {'city': 'Nagpur', 'state': 'Maharashtra', 'lat_range': (21.0846, 21.1936), 'lng_range': (78.9629, 79.1133)},
            {'city': 'Thiruvananthapuram', 'state': 'Kerala', 'lat_range': (8.4855, 8.5478), 'lng_range': (76.9366, 77.0083)},
            {'city': 'Vadodara', 'state': 'Gujarat', 'lat_range': (22.2736, 22.3649), 'lng_range': (73.1812, 73.2084)},
            {'city': 'Surat', 'state': 'Gujarat', 'lat_range': (21.1458, 21.2514), 'lng_range': (72.7662, 72.8479)}
        ]
        
        for provider in providers:
            city_info = random.choice(indian_cities)
            lat = round(random.uniform(city_info['lat_range'][0], city_info['lat_range'][1]), 6)
            lng = round(random.uniform(city_info['lng_range'][0], city_info['lng_range'][1]), 6)
            
            # Generate Indian-style addresses
            street_numbers = ['A-', 'B-', 'C-', '']
            plot_numbers = random.randint(1, 999)
            sectors = ['Sector ' + str(random.randint(1, 50)), 'Block ' + random.choice(['A', 'B', 'C', 'D']), '']
            areas = ['Nagar', 'Colony', 'Layout', 'Extension', 'Park', 'Road', 'Street']
            
            street_name = f"{street_numbers[random.randint(0, len(street_numbers)-1)]}{plot_numbers}"
            if random.choice([True, False]):
                street_name += f", {random.choice(sectors)}"
            street_name += f" {fake.street_name()} {random.choice(areas)}"
            
            # Indian postal codes (6 digits)
            postal_code = f"{random.randint(100000, 999999)}"
            
            address = Address(
                provider=provider,
                street=street_name,
                city=city_info['city'],
                state=city_info['state'],
                postal_code=postal_code,
                country='India',
                latitude=lat,
                longitude=lng,
                is_primary=True
            )
            addresses_to_create.append(address)
        
        Address.objects.bulk_create(addresses_to_create, batch_size=100)

        # --- Bulk Create Services ---
        self.stdout.write('🛠️ Creating services...')
        services_to_create = []
        
        for provider in providers:
            # Each provider gets 2-4 services
            num_services = random.randint(2, 4)
            provider_categories = random.sample(all_categories, min(num_services, len(all_categories)))
            
            for i, category in enumerate(provider_categories):
                service_type = random.choice(service_categories)
                base_name = category.name if category.name != 'Home Services' else random.choice(['General', 'Standard', 'Basic'])
                
                service = Service(
                    provider=provider,
                    name=f"{service_type} {base_name}",
                    description=fake.text(max_nb_chars=200),
                    category=category,
                    price=round(random.uniform(25.0, 500.0), 2),
                    is_active=True
                )
                services_to_create.append(service)
        
        Service.objects.bulk_create(services_to_create, batch_size=200)

        # --- Bulk Create Reviews ---
        self.stdout.write('⭐ Creating customer reviews...')
        customers = User.objects.filter(role='customer')
        reviews_to_create = []
        
        # Enhanced Indian-context review comments
        excellent_comments = [
            "Outstanding service! Truly professional and reliable. Highly recommend to everyone in the community.",
            "Exceptional quality work with great attention to detail. Very satisfied with the results.",
            "Amazing service provider! Quick response, fair pricing, and excellent workmanship.",
            "Top-class service! They understand local needs perfectly. Will definitely use again.",
            "Fantastic experience! Professional, punctual, and delivered beyond expectations.",
            "Excellent service with honest pricing. No hidden charges. Very trustworthy.",
            "Outstanding quality and timely delivery. Great communication throughout the project.",
            "Superb work! Very skilled professionals who take pride in their craft.",
            "Amazing customer service! They went above and beyond to ensure satisfaction.",
            "Perfect service! Reliable, efficient, and very reasonable rates. 5 stars!"
        ]
        
        good_comments = [
            "Very good service overall. Professional approach and quality work.",
            "Good experience. Work completed on time with satisfactory results.",
            "Solid service provider. Reliable and fair pricing. Recommended.",
            "Good quality work. Minor delays but overall satisfied with the outcome.",
            "Professional service with good results. Would use their services again.",
            "Good communication and decent work quality. Happy with the service.",
            "Reliable service provider. Good value for money and timely completion.",
            "Satisfied with the work quality. Professional and courteous staff.",
            "Good service overall. Met our requirements and expectations well.",
            "Decent work quality with fair pricing. Good local service provider."
        ]
        
        average_comments = [
            "Average service. Work was completed but took longer than expected.",
            "Okay service overall. Nothing exceptional but gets the job done.",
            "Standard service. Price was reasonable and work was acceptable.",
            "Fair service. Some minor issues but resolved eventually.",
            "Decent service provider. Room for improvement in communication.",
            "Average experience. Work quality was satisfactory, timing could be better.",
            "Reasonable service. Met basic requirements but nothing extraordinary.",
            "Standard work quality. Price was fair but service could be more efficient.",
            "Okay experience overall. Work completed but had some minor concerns.",
            "Average service provider. Would consider other options next time."
        ]
        
        poor_comments = [
            "Service was below expectations. Poor communication and delayed completion.",
            "Not satisfied with the quality of work. Had to ask for corrections multiple times.",
            "Poor service experience. Unprofessional approach and substandard work.",
            "Disappointing service. Work quality was poor and pricing was not transparent.",
            "Below average service. Many issues that needed to be resolved later.",
            "Not happy with the service. Poor quality work and lack of professionalism.",
            "Unsatisfactory experience. Would not recommend to others.",
            "Poor service quality. Had problems that were not addressed properly.",
            "Below expectations. Service was rushed and quality suffered.",
            "Not a good experience. Better options available in the area."
        ]
        
        # Create realistic review distribution (more positive reviews as typical in Indian markets)
        for _ in range(min(DataConfig.NUM_REVIEWS, len(customers) * len(providers) // 8)):  # Higher review ratio
            customer = random.choice(customers)
            provider = random.choice(providers)
            
            # Avoid duplicate reviews (same customer, same provider)
            if not any(r.provider == provider and r.user == customer for r in reviews_to_create):
                # Weighted distribution: Indian markets tend to have more positive reviews
                rating = random.choices([1, 2, 3, 4, 5], weights=[3, 7, 15, 40, 35])[0]
                
                if rating == 5:
                    comment = random.choice(excellent_comments)
                elif rating == 4:
                    comment = random.choice(good_comments)
                elif rating == 3:
                    comment = random.choice(average_comments)
                else:
                    comment = random.choice(poor_comments)
                
                # Add some variation in review timing (from 1 month to 2 years ago)
                from datetime import datetime, timedelta
                days_ago = random.randint(30, 730)
                review_date = datetime.now() - timedelta(days=days_ago)
                
                review = Review(
                    user=customer,
                    provider=provider,
                    rating=rating,
                    comment=comment,
                    is_verified=random.choices([True, False], weights=[70, 30])[0],  # 70% verified reviews
                    created_at=review_date
                )
                reviews_to_create.append(review)
        
        Review.objects.bulk_create(reviews_to_create, batch_size=200, ignore_conflicts=True)

        # --- Summary ---
        final_stats = {
            'providers': Provider.objects.count(),
            'customers': User.objects.filter(role='customer').count(),
            'services': Service.objects.count(),
            'reviews': Review.objects.count(),
            'categories': Category.objects.count(),
            'addresses': Address.objects.count()
        }

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('🎉 BULK DATA SEEDING COMPLETED!'))
        self.stdout.write('='*60)
        for key, value in final_stats.items():
            self.stdout.write(f'📊 {key.title()}: {value:,}')
        self.stdout.write('='*60)
        self.stdout.write('💡 Test your application performance at:')
        self.stdout.write('   🌐 Frontend: http://localhost:3000/')
        self.stdout.write('   🔧 API: http://localhost:8000/api/providers/')
        self.stdout.write('   ⚙️ Admin: http://localhost:8000/admin/')
        self.stdout.write('\n✨ Your application now has realistic scale for performance testing!')