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

    // Complete client list based on your requirements
    const clientList = [
        { id: 'aan-services', name: 'AAN Services' },
        { id: 'alpine-investments', name: 'Alpine Investments' },
        { id: 'apple-tree-partners', name: 'Apple Tree Partners' },
        { id: 'arch-street-capital', name: 'Arch Street Capital' },
        { id: 'bedeschi-america', name: 'Bedeschi America' },
        { id: 'blue-aerospace', name: 'Blue Aerospace' },
        { id: 'botanical-designs', name: 'Botanical Designs' },
        { id: 'brighton-group-lieberman', name: 'Brighton Group / Lieberman' },
        { id: 'calixto-global-investors', name: 'Calixto Global Investors' },
        { id: 'coco-bahamas-tropic', name: 'Coco Bahamas (Tropic)' },
        { id: 'china-overseas-america', name: 'China Overseas America' },
        { id: 'cosmetic-solutions', name: 'Cosmetic Solutions' },
        { id: 'd-d-aviation', name: 'D & D Aviation' },
        { id: 'feam', name: 'FEAM' },
        { id: 'fir-tree', name: 'Fir Tree' },
        { id: 'first-liberties-financial', name: 'First Liberties Financial' },
        { id: 'framework-ventures', name: 'Framework Ventures' },
        { id: 'further-films', name: 'Further Films' },
        { id: 'holistix-welevelup', name: 'Holistix (WeLevelUp)' },
        { id: 'hudson-executive-capital', name: 'Hudson Executive Capital LP' },
        { id: 'hudson-sustainable-group', name: 'Hudson Sustainable Group' },
        { id: 'hurricane-aerospace-solutions', name: 'Hurricane Aerospace Solutions' },
        { id: 'inspyr-solutions', name: 'INSPYR Solutions' },
        { id: 'integrated-media', name: 'Integrated Media' },
        { id: 'intelligent-portfolio', name: 'Intelligent Portfolio' },
        { id: 'kcd-inc', name: 'KCD, Inc' },
        { id: 'lavior', name: 'Lavior' },
        { id: 'linden-shore', name: 'Linden Shore' },
        { id: 'loesche-america', name: 'Loesche America' },
        { id: 'long-ridge-equity-partners', name: 'Long Ridge Equity Partners' },
        { id: 'mplt-healthcare', name: 'MPLT Healthcare' },
        { id: 'mgx', name: 'MGX' },
        { id: 'mubadala-capital', name: 'Mubadala Capital' },
        { id: 'mubadala-investment', name: 'Mubadala Investment' },
        { id: 'nanotronics', name: 'Nanotronics' },
        { id: 'ocean-air-arc145', name: 'Ocean Air / ARC145' },
        { id: 'opera-america', name: 'OPERA America LLC' },
        { id: 'oxxo', name: 'OXXO' },
        { id: 'paragon-outcomes', name: 'Paragon Outcomes' },
        { id: 'pem-air-turbine-pates', name: 'PEM Air Turbine (PATES)' },
        { id: 'prose-hair', name: 'Prose Hair' },
        { id: 'remedy-drinks', name: 'Remedy Drinks' },
        { id: 'riverie-farm', name: 'Riverie Farm' },
        { id: 'samson-capital-group', name: 'Samson Capital Group' },
        { id: 'samson-investment-partners', name: 'Samson Investment Partners' },
        { id: 'seligson-rothman-rothman', name: 'Seligson, Rothman & Rothman' },
        { id: 'sentry-aerospares', name: 'Sentry Aerospares' },
        { id: 'somos-foods', name: 'Somos Foods' },
        { id: 'steiner-leisure', name: 'Steiner Leisure' },
        { id: 'steven-douglas', name: 'Steven Douglas' },
        { id: 'systematic-financial', name: 'Systematic Financial' },
        { id: 'tally-health', name: 'Tally Health' },
        { id: 'the-vertical-group', name: 'The Vertical Group' },
        { id: 'time-equities', name: 'Time Equities, Inc.' },
        { id: 'tkg-business-management', name: 'TKG Business Management' },
        { id: 'touch-point-aviation', name: 'Touch Point Aviation' },
        { id: 'tropic-ocean-airways', name: 'Tropic Ocean Airways' },
        { id: 'valley-forge-capital', name: 'Valley Forge Capital' },
        { id: 'velocity-capital-management', name: 'Velocity Capital Management' },
        { id: 'water-asset-management', name: 'Water Asset Management, LLC.' },
        { id: 'wencor-group', name: 'Wencor Group' },
        { id: 'test-client', name: 'Test Client' }
    ];
    
    context.res = {
        status: 200,
        headers,
        body: clientList
    };
};
