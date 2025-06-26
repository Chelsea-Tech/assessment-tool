const { CosmosClient } = require('@azure/cosmos');
const Joi = require('joi');

// Initialize Cosmos DB
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database('AssessmentDB');
const container = database.container('ClientAssessments');

// Validation schemas
const clientIdSchema = Joi.string().pattern(/^[a-zA-Z0-9\-_]+$/).min(1).max(50);
const policySchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    userImpact: Joi.string().allow(''),
    tech: Joi.string().allow(''),
    status: Joi.string().valid('Compliant', 'Partially Compliant', 'Not-Compliant', null).allow(null),
    clientApproval: Joi.string().valid('approved', 'denied', null).allow(null),
    notes: Joi.string().allow(''),
    rolloutDate: Joi.string().allow('')
});

module.exports = async function (context, req) {
    context.log('Policy Update API called');

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
        const policyId = req.params.policyId;
        
        // Validate client ID
        const { error: clientError } = clientIdSchema.validate(clientId);
        if (clientError) {
            context.res = {
                status: 400,
                headers: headers,
                body: { error: 'Invalid client ID format' }
            };
            return;
        }

        // Validate policy data
        const { error: policyError, value: policyUpdate } = policySchema.validate(req.body);
        if (policyError) {
            context.res = {
                status: 400,
                headers: headers,
                body: { error: policyError.details[0].message }
            };
            return;
        }

        // Get existing assessment
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
        
        // Find and update the specific policy
        let policyFound = false;
        Object.keys(assessment.assessmentData).forEach(category => {
            const policyIndex = assessment.assessmentData[category].findIndex(p => p.id === policyId);
            if (policyIndex !== -1) {
                assessment.assessmentData[category][policyIndex] = policyUpdate;
                policyFound = true;
            }
        });
        
        if (!policyFound) {
            context.res = {
                status: 404,
                headers: headers,
                body: { error: 'Policy not found' }
            };
            return;
        }
        
        assessment.lastModified = new Date().toISOString();
        
        const { resource: updatedAssessment } = await container.items.upsert(assessment);
        
        context.res = {
            status: 200,
            headers: headers,
            body: { success: true, data: updatedAssessment }
        };

    } catch (err) {
        context.log.error('Error in policy update function:', err);
        context.res = {
            status: 500,
            headers: headers,
            body: { error: 'Internal server error', details: err.message }
        };
    }
};
