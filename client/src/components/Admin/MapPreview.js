
import React from 'react';

const MapPreview = ({ address }) => {
    // Base URL for the Google Maps embed API
    const mapBaseUrl = 'https://www.google.com/maps/embed/v1/place';
    
    // Your Google Maps API key from environment variables
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    // If the API key is missing, display a message instead of a broken map
    if (!apiKey) {
        return (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                <p className="text-gray-500 text-sm">Map requires API key</p>
            </div>
        );
    }

    // Construct the map URL with the address and API key
    const mapUrl = `${mapBaseUrl}?key=${apiKey}&q=${encodeURIComponent(address)}`;

    return (
        <div className="w-full h-48 mt-4 rounded-lg overflow-hidden shadow-md">
            <iframe
                title={`Map of ${address}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
            ></iframe>
        </div>
    );
};

export default MapPreview;
