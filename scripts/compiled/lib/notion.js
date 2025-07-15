"use strict";
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
exports.ROADMAP_V1_1_SCHEMA = exports.LAUNCH_TRACKER_SCHEMA = exports.NOTION_DATABASES = exports.notion = void 0;
exports.createLaunchTrackerItem = createLaunchTrackerItem;
exports.createRoadmapItem = createRoadmapItem;
exports.updateLaunchTrackerMetrics = updateLaunchTrackerMetrics;
var client_1 = require("@notionhq/client");
// Initialize Notion client
exports.notion = new client_1.Client({
    auth: process.env.NOTION_API_TOKEN,
});
// Database IDs (will be set after creation)
exports.NOTION_DATABASES = {
    LAUNCH_TRACKER: process.env.NOTION_LAUNCH_TRACKER_DB_ID || '',
    ROADMAP_V1_1: process.env.NOTION_ROADMAP_V1_1_DB_ID || '',
};
// Notion database creation schemas
exports.LAUNCH_TRACKER_SCHEMA = {
    title: [
        {
            type: 'text',
            text: {
                content: 'Slack Summary Scribe - Launch Tracker',
            },
        },
    ],
    parent: {
        type: 'page_id',
        page_id: '', // Will be set dynamically
    },
    properties: {
        'Title': {
            title: {},
        },
        'Status': {
            select: {
                options: [
                    { name: 'New', color: 'blue' },
                    { name: 'In Progress', color: 'yellow' },
                    { name: 'Done', color: 'green' },
                ],
            },
        },
        'Category': {
            select: {
                options: [
                    { name: 'Product Hunt Metrics', color: 'purple' },
                    { name: 'Signup Funnel', color: 'orange' },
                    { name: 'Bug Reports', color: 'red' },
                    { name: 'Resolved Issues', color: 'green' },
                    { name: 'Feedback & Ideas', color: 'blue' },
                ],
            },
        },
        'Priority': {
            select: {
                options: [
                    { name: 'Low', color: 'gray' },
                    { name: 'Medium', color: 'yellow' },
                    { name: 'High', color: 'red' },
                ],
            },
        },
        'Description': {
            rich_text: {},
        },
        'Upvotes': {
            number: {},
        },
        'Comments': {
            number: {},
        },
        'Signups': {
            number: {},
        },
        'Conversions': {
            number: {},
        },
        'Created': {
            created_time: {},
        },
        'Last Updated': {
            last_edited_time: {},
        },
    },
};
exports.ROADMAP_V1_1_SCHEMA = {
    title: [
        {
            type: 'text',
            text: {
                content: 'Slack Summary Scribe v1.1 Roadmap',
            },
        },
    ],
    parent: {
        type: 'page_id',
        page_id: '', // Will be set dynamically
    },
    properties: {
        'Feature Name': {
            title: {},
        },
        'Priority': {
            select: {
                options: [
                    { name: 'P0', color: 'red' },
                    { name: 'P1', color: 'orange' },
                    { name: 'P2', color: 'yellow' },
                ],
            },
        },
        'Expected Impact': {
            select: {
                options: [
                    { name: 'Retention', color: 'green' },
                    { name: 'Acquisition', color: 'blue' },
                    { name: 'Engagement', color: 'purple' },
                ],
            },
        },
        'Status': {
            select: {
                options: [
                    { name: 'Planned', color: 'gray' },
                    { name: 'In Development', color: 'yellow' },
                    { name: 'Completed', color: 'green' },
                ],
            },
        },
        'Description': {
            rich_text: {},
        },
        'Estimated Effort': {
            select: {
                options: [
                    { name: '1-2 weeks', color: 'green' },
                    { name: '3-4 weeks', color: 'yellow' },
                    { name: '1-2 months', color: 'orange' },
                    { name: '3+ months', color: 'red' },
                ],
            },
        },
        'Created': {
            created_time: {},
        },
        'Last Updated': {
            last_edited_time: {},
        },
    },
};
// Helper functions for Notion operations
function createLaunchTrackerItem(item) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.notion.pages.create({
                            parent: {
                                database_id: exports.NOTION_DATABASES.LAUNCH_TRACKER,
                            },
                            properties: __assign(__assign(__assign(__assign({ 'Title': {
                                    title: [
                                        {
                                            text: {
                                                content: item.title,
                                            },
                                        },
                                    ],
                                }, 'Status': {
                                    select: {
                                        name: item.status,
                                    },
                                }, 'Category': {
                                    select: {
                                        name: item.category,
                                    },
                                }, 'Priority': {
                                    select: {
                                        name: item.priority,
                                    },
                                }, 'Description': {
                                    rich_text: [
                                        {
                                            text: {
                                                content: item.description || '',
                                            },
                                        },
                                    ],
                                } }, (((_a = item.metrics) === null || _a === void 0 ? void 0 : _a.upvotes) && {
                                'Upvotes': {
                                    number: item.metrics.upvotes,
                                },
                            })), (((_b = item.metrics) === null || _b === void 0 ? void 0 : _b.comments) && {
                                'Comments': {
                                    number: item.metrics.comments,
                                },
                            })), (((_c = item.metrics) === null || _c === void 0 ? void 0 : _c.signups) && {
                                'Signups': {
                                    number: item.metrics.signups,
                                },
                            })), (((_d = item.metrics) === null || _d === void 0 ? void 0 : _d.conversions) && {
                                'Conversions': {
                                    number: item.metrics.conversions,
                                },
                            })),
                        })];
                case 1:
                    response = _e.sent();
                    return [2 /*return*/, response];
                case 2:
                    error_1 = _e.sent();
                    console.error('Error creating launch tracker item:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createRoadmapItem(item) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.notion.pages.create({
                            parent: {
                                database_id: exports.NOTION_DATABASES.ROADMAP_V1_1,
                            },
                            properties: __assign({ 'Feature Name': {
                                    title: [
                                        {
                                            text: {
                                                content: item.featureName,
                                            },
                                        },
                                    ],
                                }, 'Priority': {
                                    select: {
                                        name: item.priority,
                                    },
                                }, 'Expected Impact': {
                                    select: {
                                        name: item.expectedImpact,
                                    },
                                }, 'Status': {
                                    select: {
                                        name: item.status,
                                    },
                                }, 'Description': {
                                    rich_text: [
                                        {
                                            text: {
                                                content: item.description || '',
                                            },
                                        },
                                    ],
                                } }, (item.estimatedEffort && {
                                'Estimated Effort': {
                                    select: {
                                        name: item.estimatedEffort,
                                    },
                                },
                            })),
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error creating roadmap item:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateLaunchTrackerMetrics(pageId, metrics) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.notion.pages.update({
                            page_id: pageId,
                            properties: __assign(__assign(__assign(__assign({}, ((metrics === null || metrics === void 0 ? void 0 : metrics.upvotes) && {
                                'Upvotes': {
                                    number: metrics.upvotes,
                                },
                            })), ((metrics === null || metrics === void 0 ? void 0 : metrics.comments) && {
                                'Comments': {
                                    number: metrics.comments,
                                },
                            })), ((metrics === null || metrics === void 0 ? void 0 : metrics.signups) && {
                                'Signups': {
                                    number: metrics.signups,
                                },
                            })), ((metrics === null || metrics === void 0 ? void 0 : metrics.conversions) && {
                                'Conversions': {
                                    number: metrics.conversions,
                                },
                            })),
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error updating launch tracker metrics:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
