import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface S3Config {
  region: string;
  endpoint: string;
  accessKey: string;
  secretKey: string;
}

// First collect all required environment variables
const envVars = {
  region: process.env.HETZNER_S3_REGION,
  endpoint: process.env.HETZNER_S3_ENDPOINT,
  accessKey: process.env.HETZNER_S3_ACCESS_KEY,
  secretKey: process.env.HETZNER_S3_SECRET_KEY,
};

// Validate all required environment variables are present
Object.entries(envVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: HETZNER_S3_${name.toUpperCase()}`);
  }
});

// After validation, we can safely assert these as the correct types
const config: S3Config = {
  region: envVars.region as string,
  endpoint: envVars.endpoint as string,
  accessKey: envVars.accessKey as string,
  secretKey: envVars.secretKey as string,
};

const s3Client = new S3Client({
  region: config.region,
  endpoint: `https://${config.endpoint}`,
  credentials: {
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
  },
  forcePathStyle: true, // Required for compatibility with Hetzner's S3-compatible storage
});

const BUCKET_NAME = "media-storage01";
const MOVIES_PREFIX = "Media/Movies/";

export async function checkMovieFileExists(hash: string): Promise<boolean> {
  try {
    console.log(`Checking S3 for file with hash: ${hash}`);
    console.log(`Using endpoint: ${config.endpoint}`);
    console.log(`Using region: ${config.region}`);
    console.log(`Full path: ${MOVIES_PREFIX}${hash}`);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${MOVIES_PREFIX}${hash}`,
      MaxKeys: 1
    });

    console.log('Sending S3 request with params:', {
      Bucket: BUCKET_NAME,
      Prefix: `${MOVIES_PREFIX}${hash}`,
      Endpoint: s3Client.config.endpoint
    });

    const response = await s3Client.send(command);
    console.log('S3 list response:', response);

    // Check if we found any objects with the matching prefix
    return (response.Contents?.length ?? 0) > 0;
  } catch (error) {
    console.error("Detailed S3 error:", error);
    throw error;
  }
}

export async function getMovieDownloadUrl(hash: string, movieTitle: string, releaseYear: string): Promise<string> {
  try {
    console.log(`Generating signed URL for movie with hash: ${hash}`);

    // First check if the file exists
    const exists = await checkMovieFileExists(hash);
    if (!exists) {
      throw new Error('File not found in S3');
    }

    // Find the actual file name (first matching object)
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${MOVIES_PREFIX}${hash}`,
      MaxKeys: 1
    });

    const listResponse = await s3Client.send(listCommand);
    const movieKey = listResponse.Contents?.[0]?.Key;

    if (!movieKey) {
      throw new Error('Could not determine file key');
    }

    // Get file extension from the original key
    const extension = movieKey.substring(movieKey.lastIndexOf('.'));

    // Create a clean filename from the movie title (remove special characters)
    const cleanTitle = movieTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadFilename = `${cleanTitle}_${releaseYear}${extension}`;

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: movieKey,
      ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
    });

    // Generate URL that expires in 15 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    console.log(`Generated signed URL for ${hash} with filename ${downloadFilename}`);

    return signedUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}