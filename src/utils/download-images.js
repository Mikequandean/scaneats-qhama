"use strict";
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
var fs = require("fs");
var path = require("path");
var https = require("https");
var galleryBaseUrl = 'https://gallery.scaneats.app/images/';
var downloadDirectory = path.join(process.cwd(), 'public', 'images', 'gallery');
// List of image files to download
var imageFiles = [
    'ScanEatsLogo.png',
    'ScanEatsLogo_192.png',
    'ScanEatsLogo_512.png',
    'Personal%20Pic.png',
    'ScanFoodNEW.webm',
    'MealPlannerPage.webm',
    'LandingPageSignup&SigninPage.webm',
];
function downloadImage(imageUrl, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    https.get(imageUrl, function (res) {
                        if (res.statusCode !== 200) {
                            reject(new Error("Failed to download image: Status code: ".concat(res.statusCode)));
                            return;
                        }
                        var fileStream = fs.createWriteStream(filePath);
                        res.pipe(fileStream);
                        fileStream.on('finish', function () {
                            fileStream.close();
                            resolve(void 0);
                        });
                        fileStream.on('error', function (err) {
                            fs.unlink(filePath, function () { return reject(err); }); // Delete the file if error occurs
                        });
                    }).on('error', function (err) {
                        reject(err);
                    });
                })];
        });
    });
}
function ensureDirectoryExists(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs.promises.mkdir(directory, { recursive: true })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (error_1.code !== 'EEXIST') {
                        throw error_1;
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function downloadAllImages() {
    return __awaiter(this, void 0, void 0, function () {
        var imagesDir;
        return __generator(this, function (_a) {
            // await ensureDirectoryExists(downloadDirectory);
            // for (const imageFile of imageFiles) {
            //   const imageUrl = galleryBaseUrl + imageFile;
            //   const filePath = path.join(downloadDirectory, imageFile);
            //   try {
            //     await downloadImage(imageUrl, filePath);
            //     console.log(`Downloaded ${imageFile} to ${filePath}`);
            //   } catch (err) {
            //     console.error(`Failed to download ${imageFile}: ${err}`);
            //   }
            // }
            // console.log('All images downloaded!');
            console.log('Reading images from local directory');
            imagesDir = path.join(process.cwd(), 'public', 'images', 'gallery');
            fs.readdir(imagesDir, function (err, files) {
                if (err) {
                    console.error("Could not list the directory.", err);
                    process.exit(1);
                }
                files.forEach(function (file) {
                    console.log(file);
                });
            });
            return [2 /*return*/];
        });
    });
}
downloadAllImages();
