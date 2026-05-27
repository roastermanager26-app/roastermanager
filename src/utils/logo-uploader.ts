import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Downloads an external image and uploads it to the Supabase Storage bucket 'clubs'
 * in order to serve it directly from the app.
 *
 * @param logoUrl The external URL of the logo image
 * @param tenantId The ID of the club tenant
 * @returns The public Supabase Storage URL, or the original URL as a fallback if upload fails
 */
export async function uploadExternalLogoToBucket(logoUrl: string, tenantId: string): Promise<string> {
    if (!logoUrl || logoUrl.trim() === '') return '';
    
    const trimmedUrl = logoUrl.trim();
    
    // If it's already a Supabase storage URL for our clubs bucket, return it as is
    if (trimmedUrl.includes('/storage/v1/object/public/clubs/')) {
        return trimmedUrl;
    }
    
    try {
        // Fetch the external image
        const response = await fetch(trimmedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch logo from URL: ${trimmedUrl}, status: ${response.status}`);
            return trimmedUrl; // fallback
        }
        
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        
        // Determine file extension from content-type
        const contentType = response.headers.get('content-type') || 'image/png';
        let extension = 'png';
        if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
            extension = 'jpg';
        } else if (contentType.includes('image/svg+xml')) {
            extension = 'svg';
        } else if (contentType.includes('image/webp')) {
            extension = 'webp';
        } else if (contentType.includes('image/gif')) {
            extension = 'gif';
        }
        
        // Initialize Supabase admin client using server-side keys
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_SECRET!;
        
        if (!supabaseUrl || !serviceRoleKey) {
            console.warn('Supabase URL or Service Role secret is missing in environment variables.');
            return trimmedUrl; // fallback
        }
        
        const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        
        const fileName = `logos/${tenantId}_${Date.now()}.${extension}`;
        
        const { data, error } = await adminClient.storage
            .from('clubs')
            .upload(fileName, buffer, {
                contentType,
                upsert: true
            });
            
        if (error) {
            console.error('Supabase storage upload error:', error);
            return trimmedUrl; // fallback
        }
        
        // Get public URL
        const { data: publicUrlData } = adminClient.storage
            .from('clubs')
            .getPublicUrl(fileName);
            
        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Error fetching/uploading external logo:', err);
        return trimmedUrl; // fallback
    }
}
