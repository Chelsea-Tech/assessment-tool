module.exports = async function (context, req) {
    context.log('Clients List API called');
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers };
        return;
    }

    // Your client list
    const clientList = [
        { id: 'aan-services', name: 'AAN Services' },
        { id: 'alpine-investments', name: 'Alpine Investments' },
        { id: 'apple-tree-partners', name: 'Apple Tree Partners' },
        { id: 'test-client', name: 'Test Client' }
    ];
    
    context.res = {
        status: 200,
        headers,
        body: clientList
    };
};
