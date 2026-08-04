export function applyRouterResponse(response, prepared) {
  response.statusCode = prepared.statusCode;
  const setCookies = [];
  for (const [name, value] of prepared.headers) {
    if (name.toLowerCase() === "set-cookie") setCookies.push(value);
    else response.setHeader(name, value);
  }
  if (setCookies.length) response.setHeader("set-cookie", setCookies);
}

export async function renderRouterApplication(template, url, response) {
  let prepared;
  let started = false;
  const buffered = [];
  const rendered = template.render({
    $global: { url },
    onServerPrepared(value) {
      prepared = value;
    },
  });

  const startResponse = () => {
    if (!prepared) return false;
    applyRouterResponse(response, prepared);
    started = true;
    if (prepared.redirect) {
      response.end();
      return true;
    }
    for (const chunk of buffered) response.write(chunk);
    buffered.length = 0;
    return false;
  };

  for await (const chunk of rendered) {
    if (!started) {
      buffered.push(chunk);
      if (startResponse()) return;
    } else {
      response.write(chunk);
    }
  }

  if (!prepared) {
    throw new Error("The router did not report a prepared server response.");
  }
  if (!started && startResponse()) return;
  response.end();
}

export function createRequestUrl(requestUrl, applicationOrigin) {
  // Match TanStack's SSR adapters: request headers do not choose the router origin.
  const origin = new URL(applicationOrigin);
  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    throw new TypeError("The application origin must use HTTP or HTTPS.");
  }

  const requested = new URL(requestUrl || "/", "http://localhost");
  return new URL(
    `${requested.pathname}${requested.search}${requested.hash}`,
    origin.origin,
  );
}
