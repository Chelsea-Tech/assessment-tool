const { CosmosClient } = require('@azure/cosmos');
const Joi = require('joi');

// Initialize Cosmos DB
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database('AssessmentDB');
const container = database.container('ClientAssessments');

// Validation schema
const clientIdSchema = Joi.string().pattern(/^[a-zA-Z0-9\-_]+$/).min(1).max(50);

module.exports = async function (context, req) {
    context.log('Stats API called');

    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: headers
        };
        return;
    }

    try {
        const clientId = req.params.clientId;
        const { error } = clientIdSchema.validate(clientId);
        
        if (error) {
            context.res = {
                status: 400,
                headers: headers,
                body: { error: 'Invalid client ID format' }
            };
            return;
        }

        const querySpec = {
            query: 'SELECT * FROM c WHERE c.clientId = @clientId',
            parameters: [{ name: '@clientId', value: clientId }]
        };
        
        const { resources: results } = await container.items.query(querySpec).fetchAll();
        
        if (results.length === 0) {
            context.res = {
                status: 404,
                headers: headers,
                body: { error: 'Client assessment not found' }
            };
            return;
        }
        
        const assessment = results[0];
        let compliant = 0, partial = 0, nonCompliant = 0, pending = 0, approved = 0, total = 0;
        
        Object.values(assessment.assessmentData).forEach(category => {
            category.forEach(policy => {
                total++;
                if (policy.status === 'Compliant') compliant++;
                else if (policy.status === 'Partially Compliant') partial++;
                else if (policy.status === 'Not-Compliant') nonCompliant++;
                else pending++;
                
                if (policy.clientApproval === 'approved') approved++;
            });
        });
        
        const stats = {
            total,
            compliant,
            partial,
            nonCompliant,
            pending,
            approved,
            percentages: {
                compliant: total > 0 ? Math.round((compliant / total) * 100) : 0,
                partial: total > 0 ? Math.round((partial / total) * 100) : 0,
                nonCompliant: total > 0 ? Math.round((nonCompliant / total) * 100) : 0,
                pending: total > 0 ? Math.round((pending / total) * 100) : 0,
                approved: total > 0 ? Math.round((approved / total) * 100) : 0
            }
        };
        
        context.res = {
            status: 200,
            headers: headers,
            body: stats
        };

    } catch (err) {
        context.log.error('Error in stats function:', err);
        context.res = {
            status: 500,
            headers: headers,
            body: { error: 'Internal server error', details: err.message }
        };
    }
};
