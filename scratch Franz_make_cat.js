const fs = require('fs');
const path = require('path');

const serverJsContent = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf-8');

const catCommand = `cat << 'EOF' > ~/backend_app/server.js
${serverJsContent}
EOF
mkdir -p ~/backend_app/tmp && touch ~/backend_app/tmp/restart.txt
echo "=== SERVER.JS SUCCESSFULLY DEPLOYED AND RESTARTED ==="
`;

fs.writeFileSync(path.join(__dirname, '../scratch/deploy_cat.txt'), catCommand);
console.log('Generated deploy_cat.txt (Size: ' + catCommand.length + ' chars)');
