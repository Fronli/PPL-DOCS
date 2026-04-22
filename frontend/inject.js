const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if(fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else if (f === 'index.html') {
            callback(dirPath);
        }
    });
}

const injection = `
    <style>
        body {
            opacity: 0;
            transition: opacity 0.2s ease;
        }
    </style>
    <script>
        window.addEventListener("load", () => {
            document.body.style.opacity = "1";
        });
    </script>
</head>`;

walkDir(__dirname, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    if(!content.includes('opacity: 0;')) {
        content = content.replace('</head>', injection);
        fs.writeFileSync(filePath, content);
        console.log('Injected into: ' + filePath);
    } else {
        console.log('Already injected in: ' + filePath);
    }
});
