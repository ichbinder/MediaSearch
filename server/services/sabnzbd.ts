const sabnzbdApiUrl = process.env.SABNZBD_API_URL?.replace(/\/+$/, "");
const sabnzbdApiKey = process.env.SABNZBD_API_KEY;

if (!sabnzbdApiUrl || !sabnzbdApiKey) {
  throw new Error("Sabnzbd API credentials are required");
}

// After validation, we can safely assert these as strings
const SABNZBD_API_URL_STR = sabnzbdApiUrl;
const SABNZBD_API_KEY_STR = sabnzbdApiKey;

interface QueueStatus {
  isInQueue: boolean;
  isProcessing: boolean;
  status?: string;
}

export async function checkSabnzbdQueue(hash: string): Promise<QueueStatus> {
  try {
    const url = new URL(`${SABNZBD_API_URL_STR}/api`);
    url.searchParams.append("mode", "queue");
    url.searchParams.append("output", "json");
    url.searchParams.append("apikey", SABNZBD_API_KEY_STR);

    const historyUrl = new URL(`${SABNZBD_API_URL_STR}/api`);
    historyUrl.searchParams.append("mode", "history");
    historyUrl.searchParams.append("output", "json");
    historyUrl.searchParams.append("apikey", SABNZBD_API_KEY_STR);
    historyUrl.searchParams.append("limit", "10");

    const [queueResponse, historyResponse] = await Promise.all([
      fetch(url),
      fetch(historyUrl),
    ]);

    if (!queueResponse.ok || !historyResponse.ok) {
      throw new Error(
        `Sabnzbd API error: ${queueResponse.status} / ${historyResponse.status}`,
      );
    }

    const [queueData, historyData] = await Promise.all([
      queueResponse.json(),
      historyResponse.json(),
    ]);

    const queueSlots = queueData?.queue?.slots || [];
    const isInQueue =
      Array.isArray(queueSlots) &&
      queueSlots.some(
        (item: any) => item?.filename && item.filename.includes(hash),
      );

    const historySlots = historyData?.history?.slots || [];
    let status: string | undefined;
    let isProcessing = false;

    Array.isArray(historySlots) &&
      historySlots.some((item: any) => {
        if (!item?.name || !item.name.includes(hash)) {
          return false;
        }

        const itemStatus = item.status?.toLowerCase() || "";

        if (
          itemStatus === "running" ||
          itemStatus === "extracting" ||
          itemStatus === "queued"
        ) {
          status = itemStatus;
          isProcessing = true;
          return true;
        } else if (itemStatus === "failed" || itemStatus === "completed") {
          status = itemStatus;
          isProcessing = false;
          return true;
        }

        return false;
      });

    return { isInQueue, isProcessing, status };
  } catch (error) {
    console.error("Error checking Sabnzbd status:", error);
    throw error;
  }
}

export async function addNzbToSabnzbd(
  nzbFile: string,
  hash: string,
  tmdbId: string,
) {
  const formData = new FormData();
  formData.append(
    "name",
    new File([nzbFile], `${hash}.nzb`, {
      type: "application/x-nzb",
    }),
  );
  formData.append("mode", "addfile");
  formData.append("nzbname", `${hash}--[[${tmdbId}]]`);
  formData.append("cat", "movies");
  formData.append("apikey", SABNZBD_API_KEY_STR);
  formData.append("output", "json");

  const response = await fetch(`${SABNZBD_API_URL_STR}/api`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sabnzbd API error: ${response.status}`);
  }

  return response.json();
}