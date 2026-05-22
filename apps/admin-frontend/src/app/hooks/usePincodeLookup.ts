import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export interface PostOffice {
    Name: string;
    Description: string | null;
    BranchType: string;
    DeliveryStatus: string;
    Circle: string;
    District: string;
    Division: string;
    Region: string;
    Block: string;
    State: string;
    Country: string;
    Pincode: string;
}

interface LookupResult {
    success: boolean;
    data?: PostOffice[];
    message?: string;
}

export const usePincodeLookup = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<PostOffice[]>([]);

    const lookup = useCallback(async (pincode: string) => {
        if (!pincode || pincode.length !== 6) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Using the base endpoint of our API
            const response = await fetch(`${API_BASE.replace('/api', '')}/api/pincode/${pincode}`);
            const json: LookupResult = await response.json();

            if (json.success && json.data) {
                setResults(json.data);
            } else {
                setError(json.message || 'Pincode not found');
                setResults([]);
            }
        } catch (err: any) {
            setError('Failed to fetch pincode data');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResults([]);
        setError(null);
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        results,
        lookup,
        reset
    };
};
