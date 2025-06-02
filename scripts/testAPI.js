// Simple script to test our API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
    console.log('Testing HireAI API endpoints...\n');

    try {
        // Test 1: Fetch all resumes
        console.log('1. Testing /api/resumes endpoint...');
        const resumesResponse = await fetch(`${BASE_URL}/api/resumes?page=1&limit=5`);
        
        if (resumesResponse.ok) {
            const resumesData = await resumesResponse.json();
            console.log(`✓ Success: Found ${resumesData.resumes.length} resumes`);
            console.log(`  Total count: ${resumesData.pagination.totalCount}`);
            
            if (resumesData.resumes.length > 0) {
                const firstResume = resumesData.resumes[0];
                console.log(`  First resume: ${firstResume.name}`);
                console.log(`  Has PDF URL: ${firstResume.pdfUrl ? 'Yes' : 'No'}`);
            }
        } else {
            console.log(`✗ Failed: ${resumesResponse.status} ${resumesResponse.statusText}`);
        }

        console.log('');

        // Test 2: Search functionality
        console.log('2. Testing /api/search endpoint...');
        const searchResponse = await fetch(`${BASE_URL}/api/search?q=developer`);
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`✓ Success: Found ${searchData.results.length} search results`);
            
            if (searchData.results.length > 0) {
                const firstResult = searchData.results[0];
                console.log(`  First result: ${firstResult.name} (${firstResult.relevance}% match)`);
                console.log(`  Has PDF URL: ${firstResult.pdfUrl ? 'Yes' : 'No'}`);
            }
        } else {
            console.log(`✗ Failed: ${searchResponse.status} ${searchResponse.statusText}`);
        }

        console.log('');

        // Test 3: Empty search
        console.log('3. Testing empty search...');
        const emptySearchResponse = await fetch(`${BASE_URL}/api/search?q=`);
        
        if (emptySearchResponse.ok) {
            const emptySearchData = await emptySearchResponse.json();
            console.log(`✓ Success: Empty search returned ${emptySearchData.results.length} results`);
        } else {
            console.log(`✗ Failed: ${emptySearchResponse.status} ${emptySearchResponse.statusText}`);
        }

    } catch (error) {
        console.error('Error testing API:', error.message);
        console.log('\nMake sure the development server is running on http://localhost:3001');
    }
}

testAPI();
