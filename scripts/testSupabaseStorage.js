import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Supabase client
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}
);

async function testStorage() {
	console.log("Testing Supabase Storage...\n");

	try {
		// Test 1: List buckets
		console.log("1. Listing all buckets...");
		const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
		
		if (bucketsError) {
			console.log(`✗ Error listing buckets: ${bucketsError.message}`);
			return;
		}
		
		console.log(`✓ Found ${buckets.length} buckets:`);
		buckets.forEach(bucket => {
			console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
		});

		// Check if resumes bucket exists
		const resumesBucket = buckets.find(b => b.name === 'resumes');
		if (!resumesBucket) {
			console.log(`\n✗ 'resumes' bucket not found!`);
			console.log(`Available buckets: ${buckets.map(b => b.name).join(', ')}`);
			return;
		}

		console.log(`\n✓ 'resumes' bucket found (${resumesBucket.public ? 'Public' : 'Private'})`);

		// Test 2: List files in resumes bucket
		console.log("\n2. Listing files in 'resumes' bucket...");
		const { data: files, error: filesError } = await supabase.storage
			.from('resumes')
			.list();

		if (filesError) {
			console.log(`✗ Error listing files: ${filesError.message}`);
			return;
		}

		console.log(`✓ Found ${files.length} files in resumes bucket`);
		if (files.length > 0) {
			console.log("First few files:");
			files.slice(0, 3).forEach(file => {
				console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
			});
		}

		// Test 3: Test public URL generation
		if (files.length > 0) {
			console.log("\n3. Testing public URL generation...");
			const firstFile = files[0];
			const { data: urlData } = supabase.storage
				.from('resumes')
				.getPublicUrl(firstFile.name);

			console.log(`✓ Public URL for ${firstFile.name}:`);
			console.log(`  ${urlData.publicUrl}`);

			// Test 4: Test if URL is accessible
			console.log("\n4. Testing URL accessibility...");
			try {
				const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
				if (response.ok) {
					console.log(`✓ URL is accessible (${response.status})`);
				} else {
					console.log(`✗ URL not accessible (${response.status} ${response.statusText})`);
				}
			} catch (fetchError) {
				console.log(`✗ Error accessing URL: ${fetchError.message}`);
			}
		}

	} catch (error) {
		console.error("Test failed:", error.message);
	}
}

testStorage();
