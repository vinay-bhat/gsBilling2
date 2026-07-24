export async function sendPostRequest(apiUrl, payload) {
  const headers = {
    'Content-Type': 'application/json',
    // Add any other headers as required
  };

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  };
  console.log('COUNTER SYNC URL', apiUrl);
  try {
    const response = await fetch(apiUrl, requestOptions);
    console.log('Sync fetch', apiUrl);
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'Unable to read error response');
      console.error('API Error Response:', errorText);
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Network Error Details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      url: apiUrl,
    });
    throw new Error(`Request failed: ${error.message}`);
  }
}

export async function sendGetRequest(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    console.log('GET Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'Unable to read error response');
      console.error('API Error Response:', errorText);
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Network Error Details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      url: apiUrl,
    });
    throw new Error(`Request failed: ${error.message} ${apiUrl}`);
  }
}
