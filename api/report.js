import axios from "axios";

export default async function handler(req, res) {

  try {

    const {
    dob,
    tob,
    city,
    state,
    country
    } = req.query;
    // STEP 1
    const location =
`${city}, ${state}, ${country}`;

const geo = await axios.get(
    "https://nominatim.openstreetmap.org/search",
        {
            params: {
            q: location,
            format: "json",
            limit: 1
            },
            headers: {
            "User-Agent": "Astrology-App"
            }
        }
        );

        if (!geo.data.length) {

        return res.status(400).json({
            error: "Location not found"
        });

        }

        const latitude =
        geo.data[0].lat;

        const longitude =
        geo.data[0].lon;

    // STEP 2
    const tokenResponse = await axios.post(
      "https://api.prokerala.com/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.PROKERALA_CLIENT_ID,
        client_secret: process.env.PROKERALA_CLIENT_SECRET
      }),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        }
      }
    );

    const token =
      tokenResponse.data.access_token;

    const datetime =
      `${dob}T${tob}:00+05:30`;

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Birth Details
    const birthDetails =
      await axios.get(
        "https://api.prokerala.com/v2/astrology/birth-details",
        {
          headers,
          params: {
            datetime,
            latitude,
            longitude
          }
        }
      );

    // Kaal Sarp
    const kaalSarp =
      await axios.get(
        "https://api.prokerala.com/v2/astrology/kaal-sarp-dosha",
        {
          headers,
          params: {
            datetime,
            latitude,
            longitude
          }
        }
      );

    // Advanced Kundli
    const advanced =
      await axios.get(
        "https://api.prokerala.com/v2/astrology/kundli/advanced",
        {
          headers,
          params: {
            datetime,
            latitude,
            longitude
          }
        }
      );

    res.status(200).json({
      birthDetails:
        birthDetails.data,

      kaalSarp:
        kaalSarp.data,

      advanced:
        advanced.data
    });

  } catch (err) {

    res.status(500).json({
      error:
        err.response?.data ||
        err.message
    });

  }

}