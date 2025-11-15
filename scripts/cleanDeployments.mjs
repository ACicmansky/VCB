//node .\scripts\cleanDeployments.mjs
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const token = process.env.VERCEL_ACCESS_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID;
const projectId = process.env.VERCEL_PROJECT_ID;
const keepDeployments = 2;

const vercelApi = axios.create({
  baseURL: 'https://api.vercel.com',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  params: {
    teamId,
    projectId,
  },
});

async function getDeployments() {
  const response = await vercelApi.get('/v6/deployments', {
    params: { projectId, teamId },
  });
  return response.data.deployments;
}

async function deleteDeployment(deploymentId) {
  await vercelApi.delete(`/v13/deployments/${deploymentId}`, {
    params: { teamId },
  });
  console.log(`Deleted deployment ${deploymentId}`);
}

async function cleanOldDeployments() {
  if (!token || !teamId || !projectId) {
    console.error('Missing environment variables');
    return;
  }
  const deployments = await getDeployments();

  // Sort deployments by creation date descending (newest first)
  deployments.sort((a, b) => b.createdAt - a.createdAt);

  // Keep only the newest 'keepDeployments'
  const deploymentsToDelete = deployments.slice(keepDeployments);

  for (const deployment of deploymentsToDelete) {
    // Optional: skip deployments with aliases (active ones)
    const aliasesRes = await vercelApi.get(`/v2/deployments/${deployment.uid}/aliases`, {
      params: { teamId },
    });
    if (aliasesRes.data.aliases.length === 0) {
      await deleteDeployment(deployment.uid);
    } else {
      console.log(`Skipping deployment ${deployment.uid} with aliases`);
    }
  }
}

cleanOldDeployments().catch(console.error);
