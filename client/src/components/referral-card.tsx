import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useReferralStatus, useReferralInfo, useCreateReferralCode } from '@/hooks/use-referrals';
import { useAuth } from '@/contexts/auth-context';
import { Gift, Copy, Check, Users, Loader2 } from 'lucide-react';

export function ReferralCard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading: statusLoading } = useReferralStatus();
  const { data: referralInfo, isLoading: infoLoading } = useReferralInfo(user?.accessToken || null);
  const createCode = useCreateReferralCode(user?.accessToken || null);

  if (statusLoading) {
    return null;
  }

  if (!status?.enabled) {
    return null;
  }

  const handleGenerateCode = async () => {
    try {
      await createCode.mutateAsync();
      toast({
        title: 'Referral code created!',
        description: 'Share your code with friends to earn rewards.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create referral code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = async () => {
    if (referralInfo?.referralCode?.code) {
      await navigator.clipboard.writeText(referralInfo.referralCode.code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card data-testid="card-referral-guest">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Give $5, Get $5
          </CardTitle>
          <CardDescription>
            Sign in to get your referral code and earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Refer friends and get ${status.discountAmount} off your next purchase when they make their first purchase of ${status.minPurchaseAmount}+.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (infoLoading) {
    return (
      <Card data-testid="card-referral-loading">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-referral">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Give $5, Get $5
        </CardTitle>
        <CardDescription>
          Share your code and earn ${status.discountAmount} for each friend who makes a purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {referralInfo?.referralCode ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-md px-4 py-3 font-mono text-lg text-center">
                {referralInfo.referralCode.code}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                data-testid="button-copy-referral"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span data-testid="text-referral-stats">
                  {referralInfo.stats.totalRewards} friends referred
                </span>
              </div>
              <Badge variant="secondary" data-testid="badge-monthly-rewards">
                {referralInfo.stats.monthlyRewardCount}/{referralInfo.stats.monthlyLimit} this month
              </Badge>
            </div>

            {referralInfo.rewards.filter(r => !r.redeemed).length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 rounded-md p-3 text-sm text-green-700 dark:text-green-300" data-testid="text-pending-rewards">
                You have {referralInfo.rewards.filter(r => !r.redeemed).length} reward(s) to redeem!
              </div>
            )}
          </>
        ) : (
          <Button
            onClick={handleGenerateCode}
            disabled={createCode.isPending}
            className="w-full"
            data-testid="button-generate-referral"
          >
            {createCode.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Get My Referral Code
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Your friend gets ${status.discountAmount} off their first purchase of ${status.minPurchaseAmount}+
        </p>
      </CardContent>
    </Card>
  );
}
