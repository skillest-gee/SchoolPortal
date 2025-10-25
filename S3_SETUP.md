# AWS S3 File Storage Setup

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# AWS S3 Settings
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_S3_BUCKET_NAME=school-portal-files
```

## S3 Bucket Configuration

1. **Create S3 Bucket**: Create a private S3 bucket named `school-portal-files`

2. **CORS Configuration**: Add this CORS policy to your bucket:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. **IAM Policy**: Create an IAM user with this policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::school-portal-files/*"
    }
  ]
}
```

## Benefits of S3 Storage

- ✅ **Scalable**: Handle unlimited files
- ✅ **Fast**: Global CDN distribution
- ✅ **Cost-effective**: Pay only for storage used
- ✅ **Secure**: Private files with signed URLs
- ✅ **Reliable**: 99.999999999% durability

## File Access

Files are accessed via signed URLs that expire after 1 hour for security.
