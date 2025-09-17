from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Category, Provider, Review

User = get_user_model()

class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='customer'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.check_password('testpass123'))

class CategoryModelTest(TestCase):
    def test_create_category(self):
        category = Category.objects.create(
            name='Home Services',
            description='Services for home maintenance'
        )
        self.assertEqual(category.name, 'Home Services')
        self.assertTrue(category.is_active)

class ProviderAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testprovider',
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.token = Token.objects.create(user=self.user)
        self.category = Category.objects.create(name='Test Category')
        
    def test_create_provider(self):
        self.client.force_authenticate(user=self.user, token=self.token)
        data = {
            'business_name': 'Test Business',
            'description': 'Test description',
            'category': self.category.id,
            'phone': '1234567890',
            'email': 'business@test.com'
        }
        response = self.client.post('/api/providers/create/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
    def test_list_providers(self):
        response = self.client.get('/api/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class AuthAPITest(APITestCase):
    def test_user_registration(self):
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'customer'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        
    def test_user_login(self):
        user = User.objects.create_user(
            username='loginuser',
            email='login@test.com',
            password='loginpass123'
        )
        data = {
            'username': 'loginuser',
            'password': 'loginpass123'
        }
        response = self.client.post('/api/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

class ReviewModelTest(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='pass123',
            role='customer'
        )
        self.provider_user = User.objects.create_user(
            username='provider',
            email='provider@test.com',
            password='pass123',
            role='provider'
        )
        self.category = Category.objects.create(name='Test Category')
        self.provider = Provider.objects.create(
            user=self.provider_user,
            business_name='Test Provider',
            category=self.category
        )
        
    def test_create_review(self):
        review = Review.objects.create(
            provider=self.provider,
            customer=self.customer,
            rating=5,
            comment='Excellent service!'
        )
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Excellent service!')
        self.assertEqual(review.provider, self.provider)
        self.assertEqual(review.customer, self.customer)
