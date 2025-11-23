import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Helper function to get or create ManisBizz folder
async function getOrCreateManisBizzFolder() {
  const drive = await getUncachableGoogleDriveClient();
  
  // Search for existing ManisBizz folder
  const response = await drive.files.list({
    q: "name='ManisBizz' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Create folder if it doesn't exist
  const folderMetadata = {
    name: 'ManisBizz',
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });

  return folder.data.id!;
}

// Upload PDF to Google Drive
export async function uploadPDFToGoogleDrive(
  pdfBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/pdf'
): Promise<{ id: string; webViewLink: string; name: string }> {
  const drive = await getUncachableGoogleDriveClient();
  const folderId = await getOrCreateManisBizzFolder();

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: mimeType,
    body: require('stream').Readable.from(pdfBuffer)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink'
  });

  return {
    id: file.data.id!,
    webViewLink: file.data.webViewLink!,
    name: file.data.name!
  };
}

// List files in ManisBizz folder
export async function listManisBizzFiles() {
  const drive = await getUncachableGoogleDriveClient();
  const folderId = await getOrCreateManisBizzFolder();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, createdTime, webViewLink, size)',
    orderBy: 'createdTime desc',
    pageSize: 100
  });

  return response.data.files || [];
}

// Delete file from Google Drive
export async function deleteFileFromGoogleDrive(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();
  await drive.files.delete({ fileId });
}
