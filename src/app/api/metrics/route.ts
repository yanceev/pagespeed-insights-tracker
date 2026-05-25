import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { metricsCollection } from "@/lib/firebase-admin";
import { normalizeUrl } from "@/lib/normalize-url";
import { isSiteId } from "@/lib/sites";
import type { PageMetric } from "@/types/tracker";

function toPageMetric(
  siteId: PageMetric["siteId"],
  id: string,
  data: DocumentData
): PageMetric {
  return {
    id,
    siteId,
    url: data.url as string,
    device: data.device as PageMetric["device"],
    timestamp: data.timestamp as string,
    performance: data.performance as number,
    accessibility: data.accessibility as number,
    bestPractices: data.bestPractices as number,
    seo: data.seo as number,
  };
}

export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get("siteId");
    if (!siteId || !isSiteId(siteId)) {
      return NextResponse.json({ error: "Invalid siteId" }, { status: 400 });
    }

    const snapshot = await metricsCollection(siteId)
      .orderBy("timestamp", "asc")
      .get();

    const metrics = snapshot.docs.map((doc) =>
      toPageMetric(siteId, doc.id, doc.data())
    );

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("GET /api/metrics:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load metrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, url, device, performance, accessibility, bestPractices, seo } =
      body;

    if (!siteId || !isSiteId(siteId)) {
      return NextResponse.json({ error: "Invalid siteId" }, { status: 400 });
    }
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (device !== "mobile" && device !== "desktop") {
      return NextResponse.json({ error: "Invalid device" }, { status: 400 });
    }

    const scores = [performance, accessibility, bestPractices, seo];
    if (scores.some((s) => typeof s !== "number" || s < 0 || s > 100)) {
      return NextResponse.json(
        { error: "Scores must be numbers between 0 and 100" },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(url);
    const timestamp = new Date().toISOString();

    const docRef = await metricsCollection(siteId).add({
      url: normalizedUrl,
      device,
      performance,
      accessibility,
      bestPractices,
      seo,
      timestamp,
      createdAt: FieldValue.serverTimestamp(),
    });

    const metric: PageMetric = {
      id: docRef.id,
      siteId,
      url: normalizedUrl,
      device,
      performance,
      accessibility,
      bestPractices,
      seo,
      timestamp,
    };

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error("POST /api/metrics:", error);
    return NextResponse.json(
      { error: "Failed to save metric" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get("siteId");
    const id = req.nextUrl.searchParams.get("id");

    if (!siteId || !isSiteId(siteId)) {
      return NextResponse.json({ error: "Invalid siteId" }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: "Metric id is required" }, { status: 400 });
    }

    await metricsCollection(siteId).doc(id).delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/metrics:", error);
    return NextResponse.json(
      { error: "Failed to delete metric" },
      { status: 500 }
    );
  }
}
