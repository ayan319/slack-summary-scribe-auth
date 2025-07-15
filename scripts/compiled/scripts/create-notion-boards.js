#!/usr/bin/env node
"use strict";
/**
 * Create Notion Launch Tracker & v1.1 Roadmap Boards
 * Automatically sets up databases for Product Hunt launch tracking and roadmap planning
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var notion_1 = require("../lib/notion");
var notion_2 = require("../lib/notion");
console.log('🚀 Creating Notion Launch Tracker & v1.1 Roadmap Boards...\n');
// First, we need to create a parent page to hold our databases
function createParentPage() {
    return __awaiter(this, void 0, void 0, function () {
        var parentPage, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('📄 Creating parent page for databases...');
                    return [4 /*yield*/, notion_1.notion.pages.create({
                            parent: {
                                type: 'page_id',
                                page_id: process.env.NOTION_DATABASE_ID || '', // Use existing workspace
                            },
                            properties: {
                                title: {
                                    title: [
                                        {
                                            text: {
                                                content: 'Slack Summary Scribe - Launch Management',
                                            },
                                        },
                                    ],
                                },
                            },
                            children: [
                                {
                                    object: 'block',
                                    type: 'heading_1',
                                    heading_1: {
                                        rich_text: [
                                            {
                                                type: 'text',
                                                text: {
                                                    content: 'Slack Summary Scribe - Launch Management',
                                                },
                                            },
                                        ],
                                    },
                                },
                                {
                                    object: 'block',
                                    type: 'paragraph',
                                    paragraph: {
                                        rich_text: [
                                            {
                                                type: 'text',
                                                text: {
                                                    content: 'This page contains the launch tracking and roadmap databases for Slack Summary Scribe.',
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        })];
                case 1:
                    parentPage = _a.sent();
                    console.log("\u2705 Parent page created: ".concat(parentPage.id));
                    return [2 /*return*/, parentPage.id];
                case 2:
                    error_1 = _a.sent();
                    console.error('❌ Error creating parent page:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create Launch Tracker Database
function createLaunchTrackerDatabase(parentPageId) {
    return __awaiter(this, void 0, void 0, function () {
        var schema, database, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('📊 Creating Launch Tracker database...');
                    schema = __assign({}, notion_1.LAUNCH_TRACKER_SCHEMA);
                    schema.parent.page_id = parentPageId;
                    return [4 /*yield*/, notion_1.notion.databases.create(schema)];
                case 1:
                    database = _a.sent();
                    console.log("\u2705 Launch Tracker database created: ".concat(database.id));
                    console.log("\uD83D\uDD17 URL: https://notion.so/".concat(database.id.replace(/-/g, '')));
                    return [2 /*return*/, database.id];
                case 2:
                    error_2 = _a.sent();
                    console.error('❌ Error creating Launch Tracker database:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create v1.1 Roadmap Database
function createRoadmapDatabase(parentPageId) {
    return __awaiter(this, void 0, void 0, function () {
        var schema, database, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('🗺️  Creating v1.1 Roadmap database...');
                    schema = __assign({}, notion_1.ROADMAP_V1_1_SCHEMA);
                    schema.parent.page_id = parentPageId;
                    return [4 /*yield*/, notion_1.notion.databases.create(schema)];
                case 1:
                    database = _a.sent();
                    console.log("\u2705 v1.1 Roadmap database created: ".concat(database.id));
                    console.log("\uD83D\uDD17 URL: https://notion.so/".concat(database.id.replace(/-/g, '')));
                    return [2 /*return*/, database.id];
                case 2:
                    error_3 = _a.sent();
                    console.error('❌ Error creating v1.1 Roadmap database:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Populate Launch Tracker with initial items
function populateLaunchTracker(databaseId) {
    return __awaiter(this, void 0, void 0, function () {
        var initialItems, _i, initialItems_1, item, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📝 Populating Launch Tracker with initial items...');
                    // Update the database ID in our notion config
                    process.env.NOTION_LAUNCH_TRACKER_DB_ID = databaseId;
                    initialItems = [
                        {
                            title: 'Product Hunt Launch Day Preparation',
                            status: 'New',
                            category: 'Product Hunt Metrics',
                            priority: 'High',
                            description: 'Prepare for Product Hunt launch day - screenshots, copy, team coordination',
                        },
                        {
                            title: 'Monitor Product Hunt Upvotes',
                            status: 'New',
                            category: 'Product Hunt Metrics',
                            priority: 'High',
                            description: 'Track upvotes throughout launch day and engage with community',
                            metrics: { upvotes: 0, comments: 0 },
                        },
                        {
                            title: 'Landing Page Traffic Analysis',
                            status: 'New',
                            category: 'Signup Funnel',
                            priority: 'Medium',
                            description: 'Monitor traffic from Product Hunt to landing page conversion',
                            metrics: { signups: 0, conversions: 0 },
                        },
                        {
                            title: 'Slack OAuth Connection Rate',
                            status: 'New',
                            category: 'Signup Funnel',
                            priority: 'High',
                            description: 'Track how many users complete Slack OAuth after signup',
                        },
                        {
                            title: 'First Summary Generation Success',
                            status: 'New',
                            category: 'Signup Funnel',
                            priority: 'High',
                            description: 'Monitor users who successfully generate their first summary',
                        },
                        {
                            title: 'Payment Conversion Tracking',
                            status: 'New',
                            category: 'Signup Funnel',
                            priority: 'Medium',
                            description: 'Track free to paid conversion rates during launch',
                        },
                    ];
                    _i = 0, initialItems_1 = initialItems;
                    _a.label = 1;
                case 1:
                    if (!(_i < initialItems_1.length)) return [3 /*break*/, 6];
                    item = initialItems_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, notion_2.createLaunchTrackerItem)(item)];
                case 3:
                    _a.sent();
                    console.log("\u2705 Created: ".concat(item.title));
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    console.error("\u274C Failed to create: ".concat(item.title), error_4);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Populate v1.1 Roadmap with planned features
function populateRoadmap(databaseId) {
    return __awaiter(this, void 0, void 0, function () {
        var roadmapItems, _i, roadmapItems_1, item, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🗺️  Populating v1.1 Roadmap with planned features...');
                    // Update the database ID in our notion config
                    process.env.NOTION_ROADMAP_V1_1_DB_ID = databaseId;
                    roadmapItems = [
                        {
                            featureName: 'Scheduled Slack Digests',
                            priority: 'P0',
                            expectedImpact: 'Retention',
                            status: 'Planned',
                            description: 'Daily/weekly summary auto-posts to keep teams engaged with regular insights',
                            estimatedEffort: '3-4 weeks',
                        },
                        {
                            featureName: 'AI Coaching Insights',
                            priority: 'P1',
                            expectedImpact: 'Engagement',
                            status: 'Planned',
                            description: 'Personalized insights based on conversation patterns to improve team communication',
                            estimatedEffort: '1-2 months',
                        },
                        {
                            featureName: 'Team Management Features',
                            priority: 'P0',
                            expectedImpact: 'Acquisition',
                            status: 'Planned',
                            description: 'Invite/manage team members with role-based permissions and workspace management',
                            estimatedEffort: '3-4 weeks',
                        },
                        {
                            featureName: 'Additional Export Formats',
                            priority: 'P1',
                            expectedImpact: 'Engagement',
                            status: 'Planned',
                            description: 'Google Docs, Trello cards, and other popular format exports for better workflow integration',
                            estimatedEffort: '1-2 weeks',
                        },
                        {
                            featureName: 'NPS Collection & Retention Triggers',
                            priority: 'P1',
                            expectedImpact: 'Retention',
                            status: 'Planned',
                            description: 'Automated follow-up surveys and retention campaigns based on usage patterns',
                            estimatedEffort: '3-4 weeks',
                        },
                        {
                            featureName: 'Advanced Analytics Dashboard',
                            priority: 'P2',
                            expectedImpact: 'Engagement',
                            status: 'Planned',
                            description: 'Detailed team communication analytics and insights for managers',
                            estimatedEffort: '1-2 months',
                        },
                        {
                            featureName: 'Mobile App (iOS/Android)',
                            priority: 'P2',
                            expectedImpact: 'Acquisition',
                            status: 'Planned',
                            description: 'Native mobile apps for on-the-go summary access and notifications',
                            estimatedEffort: '3+ months',
                        },
                        {
                            featureName: 'API & Webhooks',
                            priority: 'P1',
                            expectedImpact: 'Acquisition',
                            status: 'Planned',
                            description: 'Public API and webhooks for custom integrations and enterprise customers',
                            estimatedEffort: '1-2 months',
                        },
                    ];
                    _i = 0, roadmapItems_1 = roadmapItems;
                    _a.label = 1;
                case 1:
                    if (!(_i < roadmapItems_1.length)) return [3 /*break*/, 6];
                    item = roadmapItems_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, notion_2.createRoadmapItem)(item)];
                case 3:
                    _a.sent();
                    console.log("\u2705 Created: ".concat(item.featureName));
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    console.error("\u274C Failed to create: ".concat(item.featureName), error_5);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Main execution
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var parentPageId, launchTrackerDbId, roadmapDbId, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    console.log('🚀 Starting Notion board creation process...\n');
                    // Validate environment variables
                    if (!process.env.NOTION_API_TOKEN) {
                        throw new Error('NOTION_API_TOKEN environment variable is required');
                    }
                    if (!process.env.NOTION_DATABASE_ID) {
                        throw new Error('NOTION_DATABASE_ID environment variable is required');
                    }
                    return [4 /*yield*/, createParentPage()];
                case 1:
                    parentPageId = _a.sent();
                    return [4 /*yield*/, createLaunchTrackerDatabase(parentPageId)];
                case 2:
                    launchTrackerDbId = _a.sent();
                    return [4 /*yield*/, createRoadmapDatabase(parentPageId)];
                case 3:
                    roadmapDbId = _a.sent();
                    // Populate databases with initial data
                    return [4 /*yield*/, populateLaunchTracker(launchTrackerDbId)];
                case 4:
                    // Populate databases with initial data
                    _a.sent();
                    return [4 /*yield*/, populateRoadmap(roadmapDbId)];
                case 5:
                    _a.sent();
                    console.log('\n' + '='.repeat(60));
                    console.log('🎉 NOTION BOARDS CREATED SUCCESSFULLY!');
                    console.log('='.repeat(60));
                    console.log("\uD83D\uDCCA Launch Tracker Database ID: ".concat(launchTrackerDbId));
                    console.log("\uD83D\uDDFA\uFE0F  v1.1 Roadmap Database ID: ".concat(roadmapDbId));
                    console.log("\uD83D\uDCC4 Parent Page ID: ".concat(parentPageId));
                    console.log('\n🔧 Environment Variables to Add:');
                    console.log("NOTION_LAUNCH_TRACKER_DB_ID=".concat(launchTrackerDbId));
                    console.log("NOTION_ROADMAP_V1_1_DB_ID=".concat(roadmapDbId));
                    console.log("NOTION_PARENT_PAGE_ID=".concat(parentPageId));
                    console.log('\n🎯 Next Steps:');
                    console.log('1. Add the environment variables to your .env.local file');
                    console.log('2. Run the test script to validate integration');
                    console.log('3. Deploy to Vercel with updated environment variables');
                    return [2 /*return*/, {
                            success: true,
                            launchTrackerDbId: launchTrackerDbId,
                            roadmapDbId: roadmapDbId,
                            parentPageId: parentPageId,
                        }];
                case 6:
                    error_6 = _a.sent();
                    console.error('\n❌ Error creating Notion boards:', error_6);
                    return [2 /*return*/, {
                            success: false,
                            error: error_6 instanceof Error ? error_6.message : 'Unknown error',
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Execute if run directly
if (require.main === module) {
    main()
        .then(function (result) {
        process.exit(result.success ? 0 : 1);
    })
        .catch(function (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
exports.default = main;
