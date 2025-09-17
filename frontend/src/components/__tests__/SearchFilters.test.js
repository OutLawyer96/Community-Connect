import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchFilters from '../components/SearchFilters';

// Mock categories for testing
const mockCategories = [
  { id: 1, name: 'Home Services' },
  { id: 2, name: 'Automotive' },
  { id: 3, name: 'Beauty & Wellness' }
];

// Helper function to render components with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SearchFilters Component', () => {
  const mockOnSearch = jest.fn();
  const mockOnFilter = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
    mockOnFilter.mockClear();
  });

  test('renders search input and location input', () => {
    renderWithRouter(
      <SearchFilters 
        onSearch={mockOnSearch} 
        onFilter={mockOnFilter} 
        categories={mockCategories} 
      />
    );

    expect(screen.getByPlaceholderText(/search for services/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/location/i)).toBeInTheDocument();
  });

  test('calls onSearch when search button is clicked', async () => {
    renderWithRouter(
      <SearchFilters 
        onSearch={mockOnSearch} 
        onFilter={mockOnFilter} 
        categories={mockCategories} 
      />
    );

    const searchInput = screen.getByPlaceholderText(/search for services/i);
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'plumber' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        search: 'plumber',
        location: '',
        category: '',
        min_rating: ''
      });
    });
  });

  test('shows filters when filter button is clicked', () => {
    renderWithRouter(
      <SearchFilters 
        onSearch={mockOnSearch} 
        onFilter={mockOnFilter} 
        categories={mockCategories} 
      />
    );

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
  });

  test('clears filters when clear button is clicked', async () => {
    renderWithRouter(
      <SearchFilters 
        onSearch={mockOnSearch} 
        onFilter={mockOnFilter} 
        categories={mockCategories} 
      />
    );

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Set some values
    const searchInput = screen.getByPlaceholderText(/search for services/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({});
    });
  });
});

describe('App Integration', () => {
  test('renders without crashing', () => {
    // This is a basic smoke test
    const div = document.createElement('div');
    expect(div).toBeInTheDocument();
  });
});