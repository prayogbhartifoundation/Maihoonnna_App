import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { AlertCircle, Tag, TrendingDown, Users, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { couponApi, packageApi } from '../../services/api';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isVisible: true,
    isAutoApply: false,
    usageLimit: '',
    perUserLimit: '',
    firstTimeOnly: false,
    campaignName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponsData, statsData, packagesData] = await Promise.all([
        couponApi.getAll(),
        couponApi.getStats(),
        packageApi.getAll()
      ]);
      setCoupons(couponsData);
      setStats(statsData || {});

      setPackages(packagesData || []);
    } catch (error) {
      console.error('Failed to load coupons data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '', name: '', description: '', type: 'percentage', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', startDate: '', endDate: '',
      isActive: true, isVisible: true, isAutoApply: false, usageLimit: '', 
      perUserLimit: '', firstTimeOnly: false, campaignName: ''
    });
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      ...coupon,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount ? coupon.minOrderAmount.toString() : '',
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      perUserLimit: coupon.perUserLimit ? coupon.perUserLimit.toString() : '',
    });
  };

  const handleSave = async () => {
    if (formData.type === 'percentage' && parseFloat(formData.discountValue) > 100) {
      alert('Discount percentage value cannot be more than 100%.');
      return;
    }
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase()
      };
      
      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, payload);
      } else {
        await couponApi.create(payload);
      }
      
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving coupon', error);
      alert('Failed to save coupon. The code might already exist.');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to deactivate coupon "${code}"?`)) return;
    try {
      await couponApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deactivating coupon', error);
      alert('Failed to deactivate coupon.');
    }
  };

  const getStatusBadge = (coupon: any) => {
    if (!coupon.isActive) return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Disabled</Badge>;
    const now = new Date();
    if (new Date(coupon.endDate) < now) return <Badge variant="secondary" className="bg-red-100 text-red-700">Expired</Badge>;
    if (new Date(coupon.startDate) > now) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Upcoming</Badge>;
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Depleted</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>;
  };

  if (loading) return <div className="p-8">Loading coupon engine...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon & Promotion Engine</h1>
          <p className="text-muted-foreground mt-2">Manage discounts, marketing campaigns, and subscription offers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
              Total Active Coupons
              <Tag className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCoupons || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
              Total Redemptions
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsages || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
              Total Discount Given
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(stats.totalDiscountGiven || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
              Failed Attempts
              <XCircle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.attempts?.FAIL || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</CardTitle>
              {editingCoupon && (
                <Button variant="link" onClick={resetForm} className="px-0 h-auto text-sm text-red-600">Cancel Edit</Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
                  <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">General</TabsTrigger>
                  <TabsTrigger value="rules" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">Rules</TabsTrigger>
                  <TabsTrigger value="limits" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">Limits</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input id="code" value={formData.code} onChange={handleInputChange} placeholder="e.g. WELCOME50" className="uppercase font-mono font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Internal reference name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Value</Label>
                      <Input id="discountValue" type="number" value={formData.discountValue} onChange={handleInputChange} placeholder={formData.type === 'percentage' ? 'e.g. 20' : 'e.g. 1000'} />
                      {formData.type === 'percentage' && parseFloat(formData.discountValue) > 100 && (
                        <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> Value cannot exceed 100%
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Valid From</Label>
                      <Input id="startDate" type="date" value={formData.startDate} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Valid Until</Label>
                      <Input id="endDate" type="date" value={formData.endDate} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minOrderAmount">Min Order (₹)</Label>
                      <Input id="minOrderAmount" type="number" value={formData.minOrderAmount} onChange={handleInputChange} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountAmount">Max Discount (₹)</Label>
                      <Input id="maxDiscountAmount" type="number" value={formData.maxDiscountAmount} onChange={handleInputChange} placeholder="Optional cap" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="limits" className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usageLimit">Global Usage Limit</Label>
                      <Input id="usageLimit" type="number" value={formData.usageLimit} onChange={handleInputChange} placeholder="Max total uses" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="perUserLimit">Per User Limit</Label>
                      <Input id="perUserLimit" type="number" value={formData.perUserLimit} onChange={handleInputChange} placeholder="e.g. 1" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New Subscribers Only</Label>
                        <p className="text-xs text-muted-foreground">Coupon only works for users with no prior subscriptions.</p>
                      </div>
                      <Switch checked={formData.firstTimeOnly} onCheckedChange={(c) => handleSwitchChange('firstTimeOnly', c)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Visible to Public</Label>
                        <p className="text-xs text-muted-foreground">Show in mobile app banner.</p>
                      </div>
                      <Switch checked={formData.isVisible} onCheckedChange={(c) => handleSwitchChange('isVisible', c)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Active Status</Label>
                        <p className="text-xs text-muted-foreground">Enable or disable this coupon.</p>
                      </div>
                      <Switch checked={formData.isActive} onCheckedChange={(c) => handleSwitchChange('isActive', c)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="p-4 bg-gray-50 border-t">
                <Button 
                  className="w-full" 
                  onClick={handleSave} 
                  disabled={
                    !formData.code || 
                    !formData.discountValue || 
                    !formData.startDate || 
                    !formData.endDate || 
                    (formData.type === 'percentage' && parseFloat(formData.discountValue) > 100)
                  }
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {coupons.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No coupons created yet. Create your first campaign to the left!
            </Card>
          ) : (
            coupons.map(coupon => (
              <Card key={coupon.id} className={`transition-all ${editingCoupon?.id === coupon.id ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b bg-gray-50/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg select-all">
                      <h3 className="font-mono font-bold text-lg tracking-widest">{coupon.code}</h3>
                    </div>
                    {getStatusBadge(coupon)}
                    {!coupon.isVisible && <Badge variant="outline" className="text-gray-500">Hidden</Badge>}
                  </div>
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 border-red-100" onClick={() => handleDelete(coupon.id, coupon.code)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Discount</Label>
                    <p className="font-semibold">{coupon.type === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}</p>
                    {coupon.maxDiscountAmount && <p className="text-xs text-muted-foreground">Up to ₹{coupon.maxDiscountAmount}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Validity</Label>
                    <p>{new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Redemptions</Label>
                    <p className="font-medium text-emerald-600">
                      {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'total'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Target Audience</Label>
                    <p>{coupon.firstTimeOnly ? 'New users only' : 'All users'}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
