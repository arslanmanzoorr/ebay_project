'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    CreditCard,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    X
} from 'lucide-react';
import { UserAccount, CreditBalance } from '@/types/auction';
import { toast } from 'sonner';

export default function CreditsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [isLoadingData, setIsLoadingData] = useState(false);
    // Removed message and error state

    const [admins, setAdmins] = useState<UserAccount[]>([]);
    const [adminCredits, setAdminCredits] = useState<{ [userId: string]: CreditBalance }>({});

    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
    const [selectedUserForTopup, setSelectedUserForTopup] = useState<string>('');
    const [topupAmount, setTopupAmount] = useState<number>(0);
    const [expirationDays, setExpirationDays] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        } else if (user && user.role !== 'super_admin') {
            router.push('/admin');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user && user.role === 'super_admin') {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const response = await fetch('/api/users/by-role?role=admin');
            const data = await response.json();

            if (data.success) {
                setAdmins(data.users);
                await loadAdminCredits(data.users);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoadingData(false);
        }
    };

    const loadAdminCredits = async (adminUsers: UserAccount[]) => {
        const creditsPromises = adminUsers.map(async (admin) => {
            try {
                const response = await fetch(`/api/credits/balance?userId=${admin.id}`);
                const data = await response.json();

                if (data.success) {
                    return { userId: admin.id, credits: data.credits };
                }
            } catch (error) {
                console.error(`Error loading credits for ${admin.id}:`, error);
            }
            return null;
        });

        const creditsResults = await Promise.all(creditsPromises);
        const creditsMap: { [userId: string]: CreditBalance } = {};

        creditsResults.forEach(result => {
            if (result) {
                creditsMap[result.userId] = result.credits;
            }
        });

        setAdminCredits(creditsMap);
    };

    const handleTopupCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForTopup || topupAmount <= 0) return;

        setIsLoadingData(true);
        try {
            const response = await fetch('/api/credits/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserForTopup,
                    amount: topupAmount,
                    description: `Credit top-up by Super Admin`,
                    expiresInDays: expirationDays
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Credits topped up successfully!');
                setTopupAmount(0);
                setSelectedUserForTopup('');
                setIsTopupModalOpen(false);
                await loadData();
            } else {
                toast.error(result.error || 'Failed to top up credits');
            }
        } catch (error) {
            toast.error('An error occurred while topping up credits');
        } finally {
            setIsLoadingData(false);
        }
    };

    if (isLoading || !user || user.role !== 'super_admin') return null;

    return (
        <div className="space-y-6">
            <div className="text-left space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
                <p className="text-gray-600">View and manage admin credit balances</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Admin Credit Balances
                    </CardTitle>
                    <CardDescription>View and manage admin credit balances</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {admins.map((admin) => {
                            const credits = adminCredits[admin.id];
                            return (
                                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-medium">{admin.name}</p>
                                            <p className="text-sm text-gray-500">{admin.email}</p>
                                        </div>
                                        {credits && (
                                            <div className="flex items-center gap-2">
                                                <Badge variant={credits.isLowBalance ? "destructive" : "default"}>
                                                    {credits.currentCredits} credits
                                                </Badge>
                                                <span className="text-sm text-gray-500">
                                                    Total: {credits.totalPurchased}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setSelectedUserForTopup(admin.id);
                                            setIsTopupModalOpen(true);
                                        }}
                                        variant="outline"
                                    >
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Top Up
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {isTopupModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Top Up Credits</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTopupModalOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleTopupCredits} className="space-y-4">
                            <div>
                                <Label>Admin</Label>
                                <Input
                                    value={admins.find(a => a.id === selectedUserForTopup)?.name || ''}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="expiration">Expiration</Label>
                                <select
                                    id="expiration"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={expirationDays === null ? 'null' : expirationDays}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setExpirationDays(value === 'null' ? null : parseInt(value));
                                    }}
                                >
                                    <option value="null">Never Expires</option>
                                    <option value="30">1 Month (30 Days)</option>
                                    <option value="90">3 Months (90 Days)</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={isLoadingData || topupAmount <= 0} className="flex-1">
                                    {isLoadingData ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Topping Up...
                                        </>
                                    ) : (
                                        'Top Up Credits'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsTopupModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
