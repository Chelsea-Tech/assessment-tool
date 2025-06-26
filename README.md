#Microsoft Best Practices Assessment Tool - Multi-Client Backend


A production-ready, multi-tenant Microsoft security assessment tool with Azure backend integration.

## 🚀 Quick Start

### Prerequisites
- Azure account with active subscription
- Node.js 18+ 
- Git

### Local Development Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd microsoft-assessment-tool
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Azure Cosmos DB credentials
```

4. **Run locally**
```bash
npm run dev
```

5. **Access the application**
- Open http://localhost:3000
- Add `?client=your-company-name` to the URL

## 🌐 Azure Deployment

### Step 1: Create Azure Resources

#### Option A: Azure CLI (Recommended)
```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-assessment-tool --location "East US"

# Create Cosmos DB account
az cosmosdb create \
  --name assessment-cosmosdb-001 \
  --resource-group rg-assessment-tool \
  --default-consistency-level Session \
  --locations regionName="East US" failoverPriority=0 isZoneRedundant=False

# Get Cosmos DB connection details
az cosmosdb show --name assessment-cosmosdb-001 --resource-group rg-assessment-tool --query documentEndpoint
az cosmosdb keys list --name assessment-cosmosdb-001 --resource-group rg-assessment-tool --query primaryMasterKey

# Create App Service Plan
az appservice plan create \
  --name assessment-plan \
  --resource-group rg-assessment-tool \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name assessment-tool-app-001 \
  --resource-group rg-assessment-tool \
  --plan assessment-plan \
  --runtime "NODE|18-lts"
```

#### Option B: Azure Portal
1. **Create Resource Group**: `rg-assessment-tool`
2. **Create Cosmos DB**:
   - Account name: `assessment-cosmosdb-001`
   - API: Core (SQL)
   - Location: East US
   - Consistency: Session
3. **Create App Service**:
   - Name: `assessment-tool-app-001`
   - Runtime: Node.js 18 LTS
   - Plan: Basic B1 or higher

### Step 2: Configure Environment Variables

Set these in Azure App Service Configuration:

```bash
# Required
COSMOS_ENDPOINT=https://assessment-cosmosdb-001.documents.azure.com:443/
COSMOS_KEY=your-cosmos-primary-key
NODE_ENV=production
ALLOWED_ORIGINS=https://assessment-tool-app-001.azurewebsites.net

# Optional
APPINSIGHTS_INSTRUMENTATIONKEY=your-app-insights-key
```

### Step 3: Deploy Application

#### Option A: GitHub Actions (Recommended)
1. **Fork this repository**
2. **Get publish profile**:
   ```bash
   az webapp deployment list-publishing-profiles \
     --name assessment-tool-app-001 \
     --resource-group rg-assessment-tool \
     --xml
   ```
3. **Add GitHub Secret**:
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: The XML content from step 2
4. **Update workflow file**:
   - Edit `.github/workflows/azure-deploy.yml`
   - Replace `your-app-service-name` with `assessment-tool-app-001`
5. **Push to main branch** - auto-deployment will start

#### Option B: Direct Deployment
```bash
# Build the application
npm run build

# Deploy using Azure CLI
az webapp deploy \
  --resource-group rg-assessment-tool \
  --name assessment-tool-app-001 \
  --src-path . \
  --type zip
```

#### Option C: VS Code Extension
1. Install "Azure App Service" extension
2. Sign in to Azure
3. Right-click your App Service
4. Select "Deploy to Web App"

### Step 4: Verify Deployment

1. **Health Check**: Visit `https://assessment-tool-app-001.azurewebsites.net/health`
2. **Application**: Visit `https://assessment-tool-app-001.azurewebsites.net?client=test-company`

## 📁 Project Structure

```
microsoft-assessment-tool/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── public/               # Frontend files
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── .github/workflows/    # GitHub Actions
│   └── azure-deploy.yml
└── README.md
```

## 🔧 API Endpoints

### Client Assessment APIs
- `GET /api/clients/:clientId/assessment` - Get assessment data
- `POST /api/clients/:clientId/assessment` - Save complete assessment
- `PUT /api/clients/:clientId/policies/:policyId` - Update specific policy
- `GET /api/clients/:clientId/stats` - Get assessment statistics

### Admin APIs
- `GET /api/admin/clients` - List all clients
- `DELETE /api/admin/clients/:clientId` - Delete client assessment

### Utility APIs
- `GET /health` - Health check endpoint

## 🎯 Usage Instructions

### For Clients
1. **Access your assessment**: `https://your-domain.com?client=your-company-name`
2. **Complete the assessment**: Mark policies as compliant/non-compliant
3. **Assign technical owners**: Use the 👤 button
4. **Set rollout dates**: Use the 📅 button
5. **Export results**: Use export buttons at the bottom

### For Administrators
1. **View all clients**: `https://your-domain.com/api/admin/clients`
2. **Monitor progress**: Each client has separate statistics
3. **Export client data**: Each client can export their own data

## 🔒 Security Features

- **Input validation** with Joi schemas
- **Rate limiting** (100 requests per 15 minutes)
- **Security headers** with Helmet.js
- **CORS protection** with configurable origins
- **Data isolation** per client
- **SQL injection protection** with parameterized queries

## 📊 Monitoring

### Application Insights (Optional)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app assessment-insights \
  --location "East US" \
  --resource-group rg-assessment-tool \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app assessment-insights \
  --resource-group rg-assessment-tool \
  --query instrumentationKey
```

Add the instrumentation key to your environment variables.

### Health Monitoring
- Endpoint: `/health`
- Returns: Server status, timestamp, version
- Use with Azure Monitor or external monitoring services

## 🚀 Performance Optimization

### Database
- **Partition key**: Uses `clientId` for optimal partitioning
- **Indexing**: Automatic indexing on frequently queried fields
- **Consistency**: Session consistency for balance of performance and consistency

### Caching
- **Static files**: Served with appropriate cache headers
- **API responses**: Consider adding Redis cache for frequently accessed data

### Scaling
- **Horizontal scaling**: App Service can auto-scale based on CPU/memory
- **Database scaling**: Cosmos DB auto-scales based on request units

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Error: Failed to initialize Cosmos DB
   ```
   - Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` in environment variables
   - Check firewall settings in Cosmos DB

2. **CORS Errors**
   ```
   Access to fetch blocked by CORS policy
   ```
   - Update `ALLOWED_ORIGINS` environment variable
   - Include your domain in the list

3. **Client Data Not Loading**
   ```
   Error: Failed to fetch assessment data
   ```
   - Check browser console for detailed error
   - Verify client ID format (alphanumeric and hyphens only)
   - Ensure database permissions are correct

4. **Deployment Failures**
   ```
   Build failed or App won't start
   ```
   - Check Azure App Service logs
   - Verify Node.js version compatibility
   - Ensure all environment variables are set

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## 📈 Scaling for Production

### High Availability
- **App Service**: Use Standard or Premium tier with multiple instances
- **Cosmos DB**: Enable multi-region writes for global distribution
- **CDN**: Use Azure CDN for static content delivery

### Cost Optimization
- **App Service**: Use auto-scaling to handle traffic spikes
- **Cosmos DB**: Monitor and optimize request units (RUs)
- **Storage**: Use appropriate consistency levels

### Backup Strategy
- **Cosmos DB**: Automatic backups included
- **Code**: GitHub repository serves as source backup
- **Configuration**: Document environment variables securely

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Azure documentation for infrastructure issues

