import axios from "axios";

export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  try {

    const {
      dob,
      tob,
      city,
      state,
      country
    } = req.query;

    // Validate Inputs
    if (!dob || !tob || !city || !state || !country) {

      return res.status(400).json({
        error: "Date of Birth, Time of Birth, City, State and Country are required."
      });

    }

    // Create Location String
    const location =
      `${city}, ${state}, ${country}`;

    // Geocode Location
    const geo = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: location,
          format: "json",
          limit: 1
        },
        headers: {
          "User-Agent": "EternalTandavAstrology/1.0"
        }
      }
    );

    if (!geo.data || geo.data.length === 0) {

      return res.status(400).json({
        error: "Location not found. Please enter a valid City, State and Country."
      });

    }

    const latitude = parseFloat(geo.data[0].lat);
    const longitude = parseFloat(geo.data[0].lon);

    // Prokerala expects coordinates as a string
    const coordinates =
      `${latitude},${longitude}`;

    // Get Access Token
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

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // India timezone
    const datetime =
      `${dob}T${tob}:00+05:30`;

    // Shared parameters
    const astrologyParams = {
      datetime,
      coordinates,
      ayanamsa: 1
    };

    // Run all API calls in parallel
    const [
      birthDetails,
      kaalSarp,
      advanced
    ] = await Promise.all([

      axios.get(
        "https://api.prokerala.com/v2/astrology/birth-details",
        {
          headers,
          params: astrologyParams
        }
      ),

      axios.get(
        "https://api.prokerala.com/v2/astrology/kaal-sarp-dosha",
        {
          headers,
          params: astrologyParams
        }
      ),

      axios.get(
        "https://api.prokerala.com/v2/astrology/kundli/advanced",
        {
          headers,
          params: astrologyParams
        }
      )

    ]);

    res.status(200).json({

      success: true,

      location: {
        city,
        state,
        country,
        latitude,
        longitude
      },

      birthDetails:
        birthDetails.data,

      kaalSarp:
        kaalSarp.data,

      advanced:
        advanced.data

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,

      error:
        err.response?.data ||
        err.message ||
        "Unknown Error"

    });

  }

}
