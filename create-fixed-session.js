// Script to create fixed Gist session - Run this once
async function createFixedSession() {
    const GITHUB_GIST_API = 'https://api.github.com/gists';
    
    const gistData = {
        description: "POE2 Party Calculator - Fixed Session for GIGOLO Group",
        public: false,
        files: {
            "poe2-party-data.json": {
                content: JSON.stringify({
                    items: [],
                    evidence: [],
                    playerConfirmations: {
                        'Player 1': 'pending',
                        'Player 2': 'pending',
                        'Player 3': 'pending',
                        'Player 4': 'pending',
                        'Player 5': 'pending',
                        'Player 6': 'pending'
                    },
                    sessionInfo: {
                        created: Date.now(),
                        lastUpdated: Date.now(),
                        createdBy: 'poe2-party-group',
                        groupName: 'GIGOLO Party Group'
                    }
                }, null, 2)
            }
        }
    };

    try {
        const response = await fetch(GITHUB_GIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gistData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        console.log('✅ Created Fixed Gist session successfully!');
        console.log('📋 Gist ID:', result.id);
        console.log('🔗 URL:', result.html_url);
        console.log('');
        console.log('🔧 Next steps:');
        console.log('1. Copy this Gist ID:', result.id);
        console.log('2. Update FIXED_GIST_ID in script.js');
        console.log('3. Remove session management UI');
        
        return result.id;
    } catch (error) {
        console.error('❌ Error creating Gist:', error);
        return null;
    }
}

// Run it when page loads (for testing)
if (typeof window !== 'undefined') {
    // Uncomment the line below to create the session
    // createFixedSession();
    console.log('Ready to create fixed session. Uncomment the line above and reload page.');
}