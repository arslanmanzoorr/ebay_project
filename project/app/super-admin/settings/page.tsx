'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    Settings,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { CreditSettings } from '@/types/auction';

export default function SettingsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [creditSettings, setCreditSettings] = useState<CreditSettings[]>([]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        } else if (user && user.role !== 'super_admin') {
            router.push('/admin');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user && user.role === 'super_admin') {
            loadCreditSettings();
        }
    }, [user]);

    const loadCreditSettings = async () => {
        setIsLoadingData(true);
        try {
            const response = await fetch('/api/credits/settings');
            const data = await response.json();

            if (data.success) {
                const settingsArray = Object.entries(data.settings).map(([name, value]) => ({
                    id: name,
                    settingName: name,
                    settingValue: value as number,
                    description: name === 'item_fetch_cost' ? 'Credits deducted per item fetched' : 'Credits deducted when item reaches research2 stage',
                    updatedAt: new Date()
                }));
                setCreditSettings(settingsArray);
            }
        } catch (error) {
            console.error('Error loading credit settings:', error);
            setError('Failed to load settings');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleUpdateCreditSettings = async (settingName: string, newValue: number) => {
        setIsLoadingData(true);
        setMessage('');
        setError('');

        try {
            const updatedSettings = { [settingName]: newValue };

            const response = await fetch('/api/credits/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: updatedSettings,
                    updatedBy: user?.id
                }),
            });

            const result = await response.json();

            if (result.success) {
                setMessage('Credit settings updated successfully!');
                await loadCreditSettings();
            } else {
                setError(result.error || 'Failed to update credit settings');
            }
        } catch (error) {
            setError('An error occurred while updating credit settings');
        } finally {
            setIsLoadingData(false);
        }
    };

    if (isLoading || !user || user.role !== 'super_admin') return null;

    return (
        <div className="space-y-6">
            <div className="text-left space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600">Configure system-wide settings and credit costs</p>
            </div>

            {message && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{message}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Credit Pricing Settings
                    </CardTitle>
                    <CardDescription>Configure credit costs for different actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {creditSettings.map((setting) => (
                            <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">
                                        {setting.settingName === 'item_fetch_cost' ? 'Item Fetch Cost' : 'Research2 Stage Cost'}
                                    </p>
                                    <p className="text-sm text-gray-500">{setting.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={setting.settingValue}
                                        onChange={(e) => {
                                            const newValue = parseInt(e.target.value);
                                            if (!isNaN(newValue) && newValue >= 0) {
                                                handleUpdateCreditSettings(setting.settingName, newValue);
                                            }
                                        }}
                                        className="w-20"
                                        min="0"
                                    />
                                    <span className="text-sm text-gray-500">credits</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
