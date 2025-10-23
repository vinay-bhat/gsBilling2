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

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

export async function sendGetRequest(apiUrl) {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message} ${apiUrl}`);
  }
}
