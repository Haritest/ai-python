#!/usr/bin/env node

/**
 * Markdown Documentation MCP Server
 * Provides tools for generating and managing markdown documentation
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// JSONRPC message handler
class MCPServer {
    constructor() {
        this.tools = {
            'generate_markdown': {
                description: 'Generate markdown documentation from JSON schema or template',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Document title' },
                        content: { type: 'string', description: 'Markdown content' },
                        filename: { type: 'string', description: 'Output filename' },
                        filepath: { type: 'string', description: 'Output directory path' }
                    },
                    required: ['title', 'content', 'filename']
                }
            },
            'read_markdown': {
                description: 'Read and parse markdown files',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filepath: { type: 'string', description: 'Path to markdown file' }
                    },
                    required: ['filepath']
                }
            },
            'list_markdown_files': {
                description: 'List all markdown files in a directory',
                inputSchema: {
                    type: 'object',
                    properties: {
                        directory: { type: 'string', description: 'Directory path to search' }
                    },
                    required: ['directory']
                }
            },
            'create_toc': {
                description: 'Generate table of contents from markdown headers',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filepath: { type: 'string', description: 'Path to markdown file' },
                        maxDepth: { type: 'number', description: 'Max header depth for TOC', default: 3 }
                    },
                    required: ['filepath']
                }
            }
        };
    }

    async handleToolCall(name, args) {
        switch (name) {
            case 'generate_markdown':
                return this.generateMarkdown(args);
            case 'read_markdown':
                return this.readMarkdown(args);
            case 'list_markdown_files':
                return this.listMarkdownFiles(args);
            case 'create_toc':
                return this.createTOC(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    generateMarkdown({ title, content, filename, filepath = '.' }) {
        const outputPath = path.join(filepath, filename);
        const markdown = `# ${title}\n\n${content}`;
        
        try {
            // Ensure directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, markdown, 'utf8');
            return {
                success: true,
                message: `Markdown file created: ${outputPath}`,
                filepath: outputPath,
                size: markdown.length
            };
        } catch (error) {
            throw new Error(`Failed to generate markdown: ${error.message}`);
        }
    }

    readMarkdown({ filepath }) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            const lines = content.split('\n');
            const headers = lines.filter(l => l.startsWith('#'));
            
            return {
                success: true,
                filepath,
                size: content.length,
                lines: lines.length,
                headers: headers,
                content: content.substring(0, 500) + (content.length > 500 ? '...' : '')
            };
        } catch (error) {
            throw new Error(`Failed to read markdown: ${error.message}`);
        }
    }

    listMarkdownFiles({ directory = '.' }) {
        try {
            const files = [];
            const walkDir = (dir) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isFile() && entry.name.endsWith('.md')) {
                        files.push(path.join(dir, entry.name));
                    } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
                        walkDir(path.join(dir, entry.name));
                    }
                }
            };
            
            walkDir(directory);
            return {
                success: true,
                directory,
                count: files.length,
                files: files
            };
        } catch (error) {
            throw new Error(`Failed to list markdown files: ${error.message}`);
        }
    }

    createTOC({ filepath, maxDepth = 3 }) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            const lines = content.split('\n');
            const toc = [];
            
            lines.forEach(line => {
                const match = line.match(/^(#{1,6})\s+(.+)$/);
                if (match) {
                    const level = match[1].length;
                    if (level <= maxDepth) {
                        const text = match[2].trim();
                        const link = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                        const indent = '  '.repeat(level - 1);
                        toc.push(`${indent}- [${text}](#${link})`);
                    }
                }
            });
            
            return {
                success: true,
                filepath,
                toc: toc.join('\n'),
                itemCount: toc.length
            };
        } catch (error) {
            throw new Error(`Failed to create TOC: ${error.message}`);
        }
    }

    async handleMessage(message) {
        const { jsonrpc, id, method, params } = message;
        
        try {
            if (method === 'initialize') {
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: Object.entries(this.tools).map(([name, tool]) => ({
                                name,
                                ...tool
                            }))
                        },
                        serverInfo: {
                            name: 'markdown-docs-mcp',
                            version: '1.0.0'
                        }
                    }
                };
            } else if (method === 'tools/list') {
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        tools: Object.entries(this.tools).map(([name, tool]) => ({
                            name,
                            ...tool
                        }))
                    }
                };
            } else if (method === 'tools/call') {
                const result = await this.handleToolCall(params.name, params.arguments || {});
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
                    }
                };
            } else {
                return {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: 'Method not found' }
                };
            }
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32603, message: error.message }
            };
        }
    }

    start() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });

        rl.on('line', async (line) => {
            try {
                const message = JSON.parse(line);
                const response = await this.handleMessage(message);
                console.log(JSON.stringify(response));
            } catch (error) {
                console.error(JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32700, message: 'Parse error' }
                }));
            }
        });

        rl.on('close', () => {
            process.exit(0);
        });
    }
}

// Start the server
const server = new MCPServer();
server.start();
