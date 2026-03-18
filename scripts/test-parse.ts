import { parseGoogleFlightsUrl } from '../src/lib/parse-google-url'

const url = 'https://www.google.com/travel/flights/booking?tfs=CBwQAhpFEgoyMDI2LTA0LTE2IiAKA0tSSxIKMjAyNi0wNC0xNhoDT1BPKgJGUjIEMzA0N2oHCAESA0tSS3IMCAISCC9tLzBwbW43QAFIAXABggELCP___________wGYAQI&tfu=CmxDalJJYkhOYU9YQnBjV05sTVdkQlJrNXdZbEZDUnkwdExTMHRMUzB0TFMxM1ptdHRNMEZCUVVGQlIyMDJORmQzUjBzM2IyOUJFZ1pHVWpNd05EY2FDd2lPOWdJUUFob0RVRXhPT0J4dzMyUT0SAggAIgMKATA&hl=pl&curr=PLN'

const result = parseGoogleFlightsUrl(url)
console.log(JSON.stringify(result, null, 2))
