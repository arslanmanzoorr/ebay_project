'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    Settings,
} from 'lucide-react';
import { CreditSettings } from '@/types/auction';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [isLoadingData, setIsLoadingData] = useState(false);

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

    // ... imports provided above, moving directly to logic replacement

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
                })).sort((a, b) => a.settingName.localeCompare(b.settingName));
                setCreditSettings(settingsArray);
            }
        } catch (error) {
            console.error('Error loading credit settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleUpdateCreditSettings = async (settingName: string, newValue: number) => {
        setIsLoadingData(true);

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
                toast.success('Credit settings updated successfully!');
                // Removed loadCreditSettings to prevent re-rendering/reordering
            } else {
                toast.error(result.error || 'Failed to update credit settings');
            }
        } catch (error) {
            toast.error('An error occurred while updating credit settings');
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

            {/* Alerts removed */}

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
                                                const newSettings = creditSettings.map(s =>
                                                    s.id === setting.id ? { ...s, settingValue: newValue } : s
                                                );
                                                setCreditSettings(newSettings);
                                            }
                                        }}
                                        className="w-20"
                                        min="0"
                                    />
                                    <span className="text-sm text-gray-500 w-12">credits</span>
                                    <Button
                                        size="sm"
                                        onClick={() => handleUpdateCreditSettings(setting.settingName, setting.settingValue)}
                                        disabled={isLoadingData}
                                    >
                                        Update
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
