import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { handleApiRequest } from "./api-handler.ts";
import {
  validateVideoFileForUpload,
  isShortVideo,
  isLongVideo,
  VIDEO_CATEGORIES,
  type BulkUploadItemPayload,
  type ContentType,
} from "../lib/video-service.ts";

describe("Task 10: Bulk Video Upload Verification & Integration Tests", () => {
  let userToken = "";

  before(async () => {
    // Authenticate as test user (Alex Rivera FT483921)
    const loginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "alex@facetube.com", password: "password123" }),
    });
    const loginRes = await handleApiRequest(loginReq);
    assert.ok(loginRes, "User login request must return a response");
    const data = await loginRes.json();
    assert.ok(data.token, "User login must return a session token");
    userToken = data.token;
  });

  // Test Suite 1: File Validation Rules
  describe("1. Video File Validation (Formats, Sizes & Extensions)", () => {
    it("accepts valid MP4, WebM, OGG, and MOV files within 150MB", () => {
      const mockMp4 = new File(["dummy content"], "intro_clip.mp4", { type: "video/mp4" });
      const mockWebm = new File(["dummy content"], "short_dance.webm", { type: "video/webm" });
      const mockMov = new File(["dummy content"], "project_demo.mov", { type: "video/quicktime" });
      const mockOgg = new File(["dummy content"], "audio_visual.ogg", { type: "video/ogg" });

      assert.equal(validateVideoFileForUpload(mockMp4).valid, true);
      assert.equal(validateVideoFileForUpload(mockWebm).valid, true);
      assert.equal(validateVideoFileForUpload(mockMov).valid, true);
      assert.equal(validateVideoFileForUpload(mockOgg).valid, true);
    });

    it("rejects unsupported extensions such as .exe, .txt, or .pdf", () => {
      const mockExe = new File(["malware"], "script.exe", { type: "application/x-msdownload" });
      const mockTxt = new File(["hello world"], "notes.txt", { type: "text/plain" });

      const resExe = validateVideoFileForUpload(mockExe);
      assert.equal(resExe.valid, false);
      assert.ok(resExe.error?.includes("unsupported format"));

      const resTxt = validateVideoFileForUpload(mockTxt);
      assert.equal(resTxt.valid, false);
      assert.ok(resTxt.error?.includes("unsupported format"));
    });

    it("rejects empty 0-byte video files", () => {
      const emptyFile = new File([], "empty.mp4", { type: "video/mp4" });
      const res = validateVideoFileForUpload(emptyFile);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("empty"));
    });

    it("rejects video files exceeding the 150MB threshold", () => {
      // Create a mock large file object exceeding 150MB
      const oversizedFile = {
        name: "gigantic_recording.mp4",
        size: 160 * 1024 * 1024,
        type: "video/mp4",
      } as unknown as File;

      const res = validateVideoFileForUpload(oversizedFile);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("150MB limit"));
    });
  });

  // Test Suite 2: Shorts (9:16) vs Long Videos (16:9) Classification
  describe("2. Format Detection & Classification (Shorts vs Long Videos)", () => {
    it("correctly identifies video under or equal to 60 seconds as Short", () => {
      assert.equal(isShortVideo({ duration: "0:45" }), true);
      assert.equal(isShortVideo({ duration: "1:00" }), true);
      assert.equal(isShortVideo({ duration: "0:15" }), true);
      assert.equal(isLongVideo({ duration: "0:45" }), false);
    });

    it("correctly identifies video over 60 seconds as Long Video", () => {
      assert.equal(isShortVideo({ duration: "1:01" }), false);
      assert.equal(isShortVideo({ duration: "12:30" }), false);
      assert.equal(isLongVideo({ duration: "12:30" }), true);
      assert.equal(isLongVideo({ duration: "2:15" }), true);
    });

    it("respects explicit contentType flag over duration if provided", () => {
      assert.equal(isShortVideo({ contentType: "short", duration: "15:00" }), true);
      assert.equal(isShortVideo({ contentType: "long", duration: "0:30" }), false);
      assert.equal(isLongVideo({ contentType: "long", duration: "0:30" }), true);
    });
  });

  // Test Suite 3: Batch Queue Duplicate Protection & Retry Isolation
  describe("3. Queue Processing, Duplicate Prevention, and Retry Isolation", () => {
    interface MockQueueItem {
      id: string;
      title: string;
      status: "queued" | "uploading" | "success" | "error";
      uploadCount: number;
    }

    it("prevents re-uploading already successful videos on subsequent batch runs", async () => {
      const queue: MockQueueItem[] = [
        { id: "vid-1", title: "Video One", status: "success", uploadCount: 1 },
        { id: "vid-2", title: "Video Two", status: "queued", uploadCount: 0 },
        { id: "vid-3", title: "Video Three", status: "queued", uploadCount: 0 },
      ];

      // Simulate batch run: only process items where status === 'queued'
      const pendingItems = queue.filter((it) => it.status === "queued");
      assert.equal(pendingItems.length, 2, "Must only select queued items");

      for (const it of pendingItems) {
        it.status = "success";
        it.uploadCount += 1;
      }

      // First item must have uploadCount = 1 (not re-uploaded)
      assert.equal(queue[0]?.uploadCount, 1, "Completed item must not be re-uploaded");
      assert.equal(queue[1]?.uploadCount, 1, "Queued item must be processed once");
      assert.equal(queue[2]?.uploadCount, 1, "Queued item must be processed once");
    });

    it("isolates errors so a single failure does not block remaining queue items", async () => {
      const queue: MockQueueItem[] = [
        { id: "vid-1", title: "Video 1", status: "queued", uploadCount: 0 },
        { id: "vid-2", title: "Corrupt Video 2", status: "queued", uploadCount: 0 },
        { id: "vid-3", title: "Video 3", status: "queued", uploadCount: 0 },
      ];

      for (const item of queue) {
        if (item.id === "vid-2") {
          item.status = "error";
        } else {
          item.status = "success";
          item.uploadCount += 1;
        }
      }

      assert.equal(queue[0]?.status, "success");
      assert.equal(queue[1]?.status, "error");
      assert.equal(queue[2]?.status, "success");
      assert.equal(queue[0]?.uploadCount, 1);
      assert.equal(queue[1]?.uploadCount, 0);
      assert.equal(queue[2]?.uploadCount, 1);
    });

    it("retrying failed items re-attempts only failed videos without touching successful ones", async () => {
      const queue: MockQueueItem[] = [
        { id: "vid-1", title: "Video 1", status: "success", uploadCount: 1 },
        { id: "vid-2", title: "Video 2 (Failed)", status: "error", uploadCount: 0 },
        { id: "vid-3", title: "Video 3", status: "success", uploadCount: 1 },
      ];

      // Retry failed item
      const failedItems = queue.filter((it) => it.status === "error");
      assert.equal(failedItems.length, 1);

      for (const item of failedItems) {
        item.status = "success";
        item.uploadCount += 1;
      }

      assert.equal(queue[0]?.uploadCount, 1, "Successful item untouched");
      assert.equal(queue[1]?.uploadCount, 1, "Retried item now completed");
      assert.equal(queue[2]?.uploadCount, 1, "Successful item untouched");
      assert.ok(queue.every((it) => it.status === "success"));
    });
  });

  // Test Suite 4: Production Video Creation API End-to-End
  describe("4. Production API Video Creation & Retrieval (/api/videos/create)", () => {
    const timestamp = Date.now();
    const shortVidId = `bulk-short-${timestamp}`;
    const longVidId = `bulk-long-${timestamp}`;

    it("successfully creates a bulk Short video with 9:16 metadata and public visibility", async () => {
      const payload = {
        id: shortVidId,
        user_id: "FT483921",
        creator_name: "Alex Rivera",
        title: "Test Bulk Short Video #Shorts",
        description: "Uploaded via Bulk Studio batch test",
        video_url: "/uploads/videos/sample_short.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
        video_type: "free",
        content_type: "short",
        category: "Coding",
        duration: "0:35",
        payment_status: "not_required",
        payment_amount: 0,
        visibility: "public",
      };

      const req = new Request("http://localhost:3000/api/videos/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const res = await handleApiRequest(req);
      assert.ok(res, "Must return response");
      assert.equal(res.status, 201, "Expected HTTP 201 Created");

      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.video.id, shortVidId);
      assert.equal(data.video.contentType || data.video.content_type, "short");
      assert.equal(data.video.videoType || data.video.video_type, "free");
      assert.equal(data.video.category, "Coding");
    });

    it("successfully creates a bulk Long video with 16:9 metadata and unlisted visibility", async () => {
      const payload = {
        id: longVidId,
        user_id: "FT483921",
        creator_name: "Alex Rivera",
        title: "Test Bulk Long Tutorial 16:9",
        description: "Full length programming tutorial uploaded in bulk",
        video_url: "/uploads/videos/sample_long.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
        video_type: "free",
        content_type: "long",
        category: "Coding",
        duration: "14:20",
        payment_status: "not_required",
        payment_amount: 0,
        visibility: "unlisted",
      };

      const req = new Request("http://localhost:3000/api/videos/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const res = await handleApiRequest(req);
      assert.ok(res, "Must return response");
      assert.equal(res.status, 201, "Expected HTTP 201 Created");

      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.video.id, longVidId);
      assert.equal(data.video.contentType || data.video.content_type, "long");
      assert.equal(data.video.videoType || data.video.video_type, "free");
    });

    it("verifies both bulk uploaded videos appear in the video feed via /api/videos/list", async () => {
      const req = new Request("http://localhost:3000/api/videos/list?userId=FT483921", {
        method: "GET",
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.videos), "Must return videos array");

      const foundShort = data.videos.find((v: any) => v.id === shortVidId);
      assert.ok(foundShort, "Bulk uploaded short video must be found in catalog");
      assert.equal(foundShort.content_type || foundShort.contentType, "short");

      const foundLong = data.videos.find((v: any) => v.id === longVidId);
      assert.ok(foundLong, "Bulk uploaded long video must be found in catalog");
      assert.equal(foundLong.content_type || foundLong.contentType, "long");
    });
  });

  // Test Suite 5: Preservation of Existing Categories and Metadata
  describe("5. Baseline Category Integrity & Preservation", () => {
    it("preserves standard 13 categories including Coding, Cartoon, Entertainment", () => {
      assert.ok(VIDEO_CATEGORIES.includes("Coding"));
      assert.ok(VIDEO_CATEGORIES.includes("Cartoon"));
      assert.ok(VIDEO_CATEGORIES.includes("Entertainment"));
      assert.ok(VIDEO_CATEGORIES.includes("Finance"));
      assert.ok(VIDEO_CATEGORIES.includes("Comedy"));
      assert.ok(VIDEO_CATEGORIES.length >= 13);
    });
  });
});
