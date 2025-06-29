"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  User, 
  Settings, 
  LogOut, 
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Package
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userOrders, setUserOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Fetch user orders
    fetchUserOrders();
  }, [session, status, router]);

  const fetchUserOrders = async () => {
    if (!session?.user?.userId) return;

    try {
      const response = await fetch(`/api/user/orders?userId=${session.user.userId}`);
      if (response.ok) {
        const orders = await response.json();
        setUserOrders(orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                {/* Custom Logo */}
                <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="TRADE RMB Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </span>
                <span className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight drop-shadow select-none">
                  TRADE RMB
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">@{session.user.username}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Greeting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-6 border border-blue-200">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome back, {session.user.name}! 👋
          </h1>
          <p className="text-gray-700 text-lg">
            Here's your dashboard overview. Track your orders, manage your profile, and buy more RMB.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{userOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total RMB</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ¥{userOrders.reduce((sum, order) => sum + (order.fields.RMB_Amount || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userOrders.filter(order => order.fields.Status === 'Pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userOrders.filter(order => order.fields.Status === 'Completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>My Orders</span>
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Buy RMB</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Edit Account</span>
            </TabsTrigger>
          </TabsList>

          {/* My Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>My Orders</span>
                </CardTitle>
                <CardDescription>
                  View all your previous RMB purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-4">Start your first RMB purchase to see your orders here.</p>
                    <Link href="/purchase">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Buy RMB Now
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GHS Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMB Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {userOrders.map((order, idx) => {
                          const status = order.fields.Status || 'Pending';
                          const statusColors = {
                            'Pending': 'bg-yellow-100 text-yellow-800',
                            'Paid': 'bg-blue-100 text-blue-800',
                            'Completed': 'bg-green-100 text-green-800',
                            'Cancelled': 'bg-red-100 text-red-800'
                          };
                          
                          return (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{order.fields.Reference_Code}</td>
                              <td className="px-4 py-3 text-gray-700">{new Date(order.fields.Submitted_At).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-green-700 font-bold">₵{order.fields.GHS_Amount?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-blue-700 font-bold">¥{order.fields.RMB_Amount?.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
                                  {status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buy RMB Tab */}
          <TabsContent value="buy" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Buy RMB</span>
                </CardTitle>
                <CardDescription>
                  Purchase RMB using our secure platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Ready to Buy RMB?
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Start your RMB purchase with our secure and fast platform. 
                    Get the best exchange rates and instant processing.
                  </p>
                  <Link href="/purchase">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="h-5 w-5 mr-2" />
                      Start Purchase
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Account Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Edit Account</span>
                </CardTitle>
                <CardDescription>
                  Update your profile information and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-purple-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Account Settings
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Update your profile information, change your password, 
                    and manage your account settings.
                  </p>
                  <Link href="/dashboard/profile">
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Settings className="h-5 w-5 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 