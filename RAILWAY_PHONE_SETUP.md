
## Railway deployment (phone-friendly)

This project includes a Dockerfile that installs FFmpeg and builds the Next.js app.
Railway can automatically detect the root `Dockerfile`.

1. Put the project files in a GitHub repository.
2. In Railway, create a project and connect that GitHub repository.
3. Railway will detect the Dockerfile and build the app.
4. Add the environment variables from `.env.example` in Railway Variables.
5. After deployment, use **Settings → Networking → Generate Domain**.
6. Open the generated URL in Chrome on your phone.

Never upload `.env` or `.env.local` to GitHub.
