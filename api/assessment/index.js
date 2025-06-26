const { CosmosClient } = require('@azure/cosmos');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database('AssessmentDB');
const container = database.container('ClientAssessments');

const clientIdSchema = Joi.string().pattern(/^[a-zA-Z0-9\-_]+$/).min(1).max(50);

function getEmptyAssessmentTemplate() {
    return {
        "Conditional Access for Evaluated Accounts": [
            {
                id: "policy_3",
                name: "CT Baseline - Require MFA For Admins",
                description: "Admin accounts are high-value targets for attackers.",
                userImpact: "Admins are required to use MFA, which adds some extra steps during login.",
                tech: "",
                status: null,
                clientApproval: null,
                notes: "",
                rolloutDate: ""
            }
        ]
    };
}

module.exports = async function (context, req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers };
        return;
    }

    try {
        const clientId = req.params.clientId;
        const { error } = clientIdSchema.validate(clientId);
        
        if (error) {
            context.res = {
                status: 400,
                headers,
                body: { error: 'Invalid client ID format' }
            };
            return;
        }

        if (req.method === 'GET') {
            const querySpec = {
                query: 'SELECT * FROM c WHERE c.clientId = @clientId',
                parameters: [{ name: '@clientId', value: clientId }]
            };
            
            const { resources: results } = await container.items.query(querySpec).fetchAll();
            
            if (results.length > 0) {
                context.res = { status: 200, headers, body: results[0] };
            } else {
                const newAssessment = {
                    id: uuidv4(),
                    clientId: clientId,
                    assessmentData: getEmptyAssessmentTemplate(),
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    version: '1.0'
                };
                context.res = { status: 200, headers, body: newAssessment };
            }
        } 
        else if (req.method === 'POST') {
            const assessmentData = req.body.assessmentData;
            
            if (!assessmentData) {
                context.res = {
                    status: 400,
                    headers,
                    body: { error: 'Assessment data is required' }
                };
                return;
            }

            const querySpec = {
                query: 'SELECT * FROM c WHERE c.clientId = @clientId',
                parameters: [{ name: '@clientId', value: clientId }]
            };
            
            const { resources: existing } = await container.items.query(querySpec).fetchAll();
            
            const document = {
                id: existing.length > 0 ? existing[0].id : uuidv4(),
                clientId: clientId,
                assessmentData: assessmentData,
                createdAt: existing.length > 0 ? existing[0].createdAt : new Date().toISOString(),
                lastModified: new Date().toISOString(),
                version: '1.0'
            };
            
            const { resource: savedAssessment } = await container.items.upsert(document);
            context.res = { status: 200, headers, body: { success: true, data: savedAssessment } };
        }

    } catch (err) {
        context.log.error('Error in assessment function:', err);
        context.res = {
            status: 500,
            headers,
            body: { error: 'Internal server error', details: err.message }
        };
    }
};
