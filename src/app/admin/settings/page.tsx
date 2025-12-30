'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Pagination,
} from '@/components/ui'
import { REQUEST_TYPE_LABELS } from '@/types'
import type { RequestType } from '@/types'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import { useOperators, useUpdateOperator, useDeleteOperator } from '@/hooks/useOperators'
import type { Database } from '@/lib/supabase/database.types'
import type { ClientWithOperator } from '@/services/clients.service'

type Profile = Database['public']['Tables']['profiles']['Row']
import {
  Users,
  Building,
  Settings,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  Key,
} from 'lucide-react'

const ITEMS_PER_PAGE = 20

export default function AdminSettingsPage() {
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: operators = [], isLoading: operatorsLoading } = useOperators()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const updateOperator = useUpdateOperator()
  const deleteOperator = useDeleteOperator()

  const [activeTab, setActiveTab] = useState<'clients' | 'operators' | 'categories'>('clients')
  const [clientsPage, setClientsPage] = useState(1)
  const [operatorsPage, setOperatorsPage] = useState(1)

  // 페이지네이션
  const clientsTotalPages = Math.ceil(clients.length / ITEMS_PER_PAGE)
  const paginatedClients = clients.slice(
    (clientsPage - 1) * ITEMS_PER_PAGE,
    clientsPage * ITEMS_PER_PAGE
  )

  const operatorsTotalPages = Math.ceil(operators.length / ITEMS_PER_PAGE)
  const paginatedOperators = operators.slice(
    (operatorsPage - 1) * ITEMS_PER_PAGE,
    operatorsPage * ITEMS_PER_PAGE
  )
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [isEditOperatorOpen, setIsEditOperatorOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientWithOperator | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<Profile | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<{ userId: string; name: string; type: 'client' | 'operator' } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false)

  // 클라이언트 폼 상태
  const [clientForm, setClientForm] = useState({
    department_name: '',
    contact_name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // 클라이언트 수정 폼 상태
  const [editClientForm, setEditClientForm] = useState({
    department_name: '',
    contact_name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    assigned_operator_id: '' as string | null,
  })

  // 담당자 수정 폼 상태
  const [editOperatorForm, setEditOperatorForm] = useState({
    name: '',
    department: '',
    role: 'operator' as 'operator' | 'admin',
    status: 'active' as 'active' | 'inactive',
  })

  // 담당자 생성 폼 상태
  const [operatorForm, setOperatorForm] = useState({
    name: '',
    email: '',
    department: '',
    role: 'operator' as 'operator' | 'admin',
    password: '',
  })
  const [isCreatingOperator, setIsCreatingOperator] = useState(false)

  const supabase = createSupabaseClient()

  // 인증 토큰 가져오기
  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [supabase])

  const isLoading = clientsLoading || operatorsLoading

  const tabs = [
    { key: 'clients', label: '클라이언트 관리', icon: <Building className="w-4 h-4" /> },
    { key: 'operators', label: '담당자 관리', icon: <Users className="w-4 h-4" /> },
    { key: 'categories', label: '카테고리 관리', icon: <Settings className="w-4 h-4" /> },
  ]

  const handleCreateClient = async () => {
    if (!clientForm.department_name || !clientForm.contact_name || !clientForm.email || !clientForm.password) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    if (clientForm.password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsCreatingClient(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        alert('로그인이 필요합니다.')
        return
      }

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          department_name: clientForm.department_name,
          contact_name: clientForm.contact_name,
          email: clientForm.email,
          phone: clientForm.phone || null,
          password: clientForm.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '클라이언트 생성에 실패했습니다.')
      }

      alert('클라이언트가 성공적으로 생성되었습니다.')
      setIsAddClientOpen(false)
      setClientForm({ department_name: '', contact_name: '', email: '', phone: '', password: '' })
      // Refresh clients list
      window.location.reload()
    } catch (error) {
      console.error('Client creation error:', error)
      alert(error instanceof Error ? error.message : '클라이언트 생성에 실패했습니다.')
    } finally {
      setIsCreatingClient(false)
    }
  }

  // 담당자 생성
  const handleCreateOperator = async () => {
    if (!operatorForm.name || !operatorForm.email || !operatorForm.password) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    if (operatorForm.password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsCreatingOperator(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        alert('로그인이 필요합니다.')
        return
      }

      const response = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: operatorForm.name,
          email: operatorForm.email,
          department: operatorForm.department || null,
          role: operatorForm.role,
          password: operatorForm.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '담당자 생성에 실패했습니다.')
      }

      alert('담당자가 성공적으로 생성되었습니다.')
      setIsAddOperatorOpen(false)
      setOperatorForm({ name: '', email: '', department: '', role: 'operator', password: '' })
      // Refresh operators list
      window.location.reload()
    } catch (error) {
      console.error('Operator creation error:', error)
      alert(error instanceof Error ? error.message : '담당자 생성에 실패했습니다.')
    } finally {
      setIsCreatingOperator(false)
    }
  }

  // 클라이언트 수정 다이얼로그 열기
  const openEditClient = (client: ClientWithOperator) => {
    setSelectedClient(client)
    setEditClientForm({
      department_name: client.department_name,
      contact_name: client.contact_name,
      email: client.email,
      phone: client.phone || '',
      status: client.status as 'active' | 'inactive',
      assigned_operator_id: client.assigned_operator_id || '',
    })
    setIsEditClientOpen(true)
  }

  // 클라이언트 담당자 배정 (테이블에서 직접 변경)
  const handleAssignClientOperator = (clientId: string, operatorId: string | null) => {
    updateClient.mutate({
      id: clientId,
      updates: {
        assigned_operator_id: operatorId || null,
      }
    })
  }

  // 클라이언트 수정 처리
  const handleUpdateClient = () => {
    if (!selectedClient) return
    if (!editClientForm.department_name || !editClientForm.contact_name || !editClientForm.email) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    updateClient.mutate({
      id: selectedClient.id,
      updates: {
        department_name: editClientForm.department_name,
        contact_name: editClientForm.contact_name,
        email: editClientForm.email,
        phone: editClientForm.phone || null,
        status: editClientForm.status,
        assigned_operator_id: editClientForm.assigned_operator_id || null,
      }
    }, {
      onSuccess: () => {
        setIsEditClientOpen(false)
        setSelectedClient(null)
      }
    })
  }

  // 클라이언트 삭제 처리
  const handleDeleteClient = (client: ClientWithOperator) => {
    if (!confirm(`'${client.department_name}' 클라이언트를 삭제하시겠습니까?`)) return

    deleteClient.mutate(client.id)
  }

  // 담당자 수정 다이얼로그 열기
  const openEditOperator = (operator: Profile) => {
    setSelectedOperator(operator)
    setEditOperatorForm({
      name: operator.name,
      department: operator.department || '',
      role: operator.role as 'operator' | 'admin',
      status: operator.status as 'active' | 'inactive',
    })
    setIsEditOperatorOpen(true)
  }

  // 담당자 수정 처리
  const handleUpdateOperator = () => {
    if (!selectedOperator) return
    if (!editOperatorForm.name) {
      alert('이름은 필수 항목입니다.')
      return
    }

    updateOperator.mutate({
      id: selectedOperator.id,
      updates: {
        name: editOperatorForm.name,
        department: editOperatorForm.department || null,
        role: editOperatorForm.role,
        status: editOperatorForm.status,
      }
    }, {
      onSuccess: () => {
        setIsEditOperatorOpen(false)
        setSelectedOperator(null)
      }
    })
  }

  // 담당자 삭제(비활성화) 처리
  const handleDeleteOperator = (operator: Profile) => {
    if (!confirm(`'${operator.name}' 담당자를 비활성화하시겠습니까?`)) return

    deleteOperator.mutate(operator.id)
  }

  // 비밀번호 변경 다이얼로그 열기 (클라이언트)
  const openPasswordDialogForClient = (client: ClientWithOperator) => {
    if (!client.user_id) {
      alert('이 클라이언트는 연결된 사용자 계정이 없습니다.')
      return
    }
    setPasswordTarget({ userId: client.user_id, name: client.contact_name, type: 'client' })
    setNewPassword('')
    setIsPasswordDialogOpen(true)
  }

  // 비밀번호 변경 다이얼로그 열기 (담당자)
  const openPasswordDialogForOperator = (operator: Profile) => {
    setPasswordTarget({ userId: operator.id, name: operator.name, type: 'operator' })
    setNewPassword('')
    setIsPasswordDialogOpen(true)
  }

  // 비밀번호 변경 처리
  const handlePasswordChange = async () => {
    if (!passwordTarget) return
    if (!newPassword || newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsPasswordUpdating(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        alert('로그인이 필요합니다.')
        return
      }

      const response = await fetch('/api/admin/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: passwordTarget.userId,
          newPassword: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.')
      }

      alert('비밀번호가 성공적으로 변경되었습니다.')
      setIsPasswordDialogOpen(false)
      setPasswordTarget(null)
      setNewPassword('')
    } catch (error) {
      console.error('Password change error:', error)
      alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsPasswordUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">시스템 관리</h1>
          <p className="text-gray-600 mt-1">
            클라이언트, 담당자 계정 및 시스템 설정을 관리합니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* 클라이언트 관리 */}
        {activeTab === 'clients' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>클라이언트 계정 관리</CardTitle>
                  <CardDescription>
                    클라이언트 계정 생성 및 담당자 배정을 관리합니다.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddClientOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  클라이언트 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>부서명</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>배정 담당자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.department_name}
                      </TableCell>
                      <TableCell>{client.contact_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {client.email}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={client.assigned_operator_id || 'none'}
                          onValueChange={(value) => handleAssignClientOperator(client.id, value === 'none' ? null : value)}
                          disabled={updateClient.isPending}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="미배정" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">미배정</SelectItem>
                            {operators
                              .filter((op) => (op.role === 'operator' || op.role === 'admin') && op.status === 'active')
                              .map((op) => (
                                <SelectItem key={op.id} value={op.id}>
                                  {op.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {client.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditClient(client)} title="수정">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openPasswordDialogForClient(client)} title="비밀번호 변경">
                            <Key className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client)} title="삭제">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={clientsPage}
                totalPages={clientsTotalPages}
                onPageChange={setClientsPage}
              />
            </CardContent>
          </Card>
        )}

        {/* 담당자 관리 */}
        {activeTab === 'operators' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>운영 담당자 관리</CardTitle>
                  <CardDescription>
                    광고 운영 담당자 계정을 관리합니다.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddOperatorOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  담당자 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOperators.map((operator) => (
                    <TableRow key={operator.id}>
                      <TableCell className="font-medium">
                        {operator.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {operator.email}
                      </TableCell>
                      <TableCell>{operator.department || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            operator.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {operator.role === 'admin' ? '관리자' : '운영자'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            operator.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {operator.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditOperator(operator)} title="수정">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openPasswordDialogForOperator(operator)} title="비밀번호 변경">
                            <Key className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteOperator(operator)} title="비활성화">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={operatorsPage}
                totalPages={operatorsTotalPages}
                onPageChange={setOperatorsPage}
              />
            </CardContent>
          </Card>
        )}

        {/* 카테고리 관리 */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 gap-6">
            {/* 요청 유형 관리 */}
            <Card>
              <CardHeader>
                <CardTitle>요청 유형 관리</CardTitle>
                <CardDescription>요청 유형을 추가하거나 수정합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][]).map(
                    ([key, label]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                      >
                        <span>{label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  요청 유형 추가
                </Button>
              </CardContent>
            </Card>

            {/* 알림 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>시스템 알림 설정을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">새 요청 알림</p>
                      <p className="text-sm text-gray-500">
                        새 요청 등록 시 담당자에게 이메일 발송
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">상태 변경 알림</p>
                      <p className="text-sm text-gray-500">
                        요청 상태 변경 시 클라이언트에게 알림
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">처리 기한 알림</p>
                      <p className="text-sm text-gray-500">
                        기한 24시간 전 담당자에게 알림
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">일일 리포트</p>
                      <p className="text-sm text-gray-500">
                        미처리 요청 현황 일일 리포트 발송
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 클라이언트 추가 다이얼로그 */}
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>클라이언트 추가</DialogTitle>
              <DialogDescription>
                새 클라이언트 계정을 생성합니다. 로그인에 사용할 이메일과 비밀번호를 설정해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="departmentName">부서명 *</Label>
                <Input
                  id="departmentName"
                  placeholder="부서명을 입력하세요"
                  value={clientForm.department_name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, department_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">담당자명 *</Label>
                <Input
                  id="contactName"
                  placeholder="담당자명을 입력하세요"
                  value={clientForm.contact_name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일 (로그인 ID) *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="최소 6자 이상 입력하세요"
                  value={clientForm.password}
                  onChange={(e) => setClientForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <p className="text-xs text-gray-500">클라이언트가 로그인할 때 사용할 비밀번호입니다.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  placeholder="연락처를 입력하세요"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateClient} disabled={isCreatingClient}>
                {isCreatingClient ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 담당자 추가 다이얼로그 */}
        <Dialog open={isAddOperatorOpen} onOpenChange={setIsAddOperatorOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>담당자 추가</DialogTitle>
              <DialogDescription>
                새 운영 담당자 계정을 생성합니다. 로그인에 사용할 이메일과 비밀번호를 설정해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="opName">이름 *</Label>
                <Input
                  id="opName"
                  placeholder="이름을 입력하세요"
                  value={operatorForm.name}
                  onChange={(e) => setOperatorForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opEmail">이메일 (로그인 ID) *</Label>
                <Input
                  id="opEmail"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={operatorForm.email}
                  onChange={(e) => setOperatorForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opPassword">비밀번호 *</Label>
                <Input
                  id="opPassword"
                  type="password"
                  placeholder="최소 6자 이상 입력하세요"
                  value={operatorForm.password}
                  onChange={(e) => setOperatorForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <p className="text-xs text-gray-500">담당자가 로그인할 때 사용할 비밀번호입니다.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opDepartment">부서</Label>
                <Input
                  id="opDepartment"
                  placeholder="부서를 입력하세요"
                  value={operatorForm.department}
                  onChange={(e) => setOperatorForm(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opRole">역할</Label>
                <Select
                  value={operatorForm.role}
                  onValueChange={(value: 'operator' | 'admin') => setOperatorForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">운영자</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOperatorOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateOperator} disabled={isCreatingOperator}>
                {isCreatingOperator ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 클라이언트 수정 다이얼로그 */}
        <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>클라이언트 수정</DialogTitle>
              <DialogDescription>
                클라이언트 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editDepartmentName">부서명 *</Label>
                <Input
                  id="editDepartmentName"
                  placeholder="부서명을 입력하세요"
                  value={editClientForm.department_name}
                  onChange={(e) => setEditClientForm(prev => ({ ...prev, department_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContactName">담당자명 *</Label>
                <Input
                  id="editContactName"
                  placeholder="담당자명을 입력하세요"
                  value={editClientForm.contact_name}
                  onChange={(e) => setEditClientForm(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">이메일 *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={editClientForm.email}
                  onChange={(e) => setEditClientForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">연락처</Label>
                <Input
                  id="editPhone"
                  placeholder="연락처를 입력하세요"
                  value={editClientForm.phone}
                  onChange={(e) => setEditClientForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClientStatus">상태</Label>
                <Select
                  value={editClientForm.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditClientForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAssignedOperator">배정 담당자</Label>
                <Select
                  value={editClientForm.assigned_operator_id || 'none'}
                  onValueChange={(value) => setEditClientForm(prev => ({ ...prev, assigned_operator_id: value === 'none' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미배정</SelectItem>
                    {operators
                      .filter((op) => (op.role === 'operator' || op.role === 'admin') && op.status === 'active')
                      .map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  이 클라이언트가 요청 등록 시 자동으로 배정될 담당자입니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>
                취소
              </Button>
              <Button onClick={handleUpdateClient} disabled={updateClient.isPending}>
                {updateClient.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 담당자 수정 다이얼로그 */}
        <Dialog open={isEditOperatorOpen} onOpenChange={setIsEditOperatorOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>담당자 수정</DialogTitle>
              <DialogDescription>
                담당자 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editOpName">이름 *</Label>
                <Input
                  id="editOpName"
                  placeholder="이름을 입력하세요"
                  value={editOperatorForm.name}
                  onChange={(e) => setEditOperatorForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editOpDepartment">부서</Label>
                <Input
                  id="editOpDepartment"
                  placeholder="부서를 입력하세요"
                  value={editOperatorForm.department}
                  onChange={(e) => setEditOperatorForm(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editOpRole">역할</Label>
                <Select
                  value={editOperatorForm.role}
                  onValueChange={(value: 'operator' | 'admin') => setEditOperatorForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">운영자</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editOpStatus">상태</Label>
                <Select
                  value={editOperatorForm.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditOperatorForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOperatorOpen(false)}>
                취소
              </Button>
              <Button onClick={handleUpdateOperator} disabled={updateOperator.isPending}>
                {updateOperator.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 비밀번호 변경 다이얼로그 */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                비밀번호 변경
              </DialogTitle>
              <DialogDescription>
                {passwordTarget?.name}님의 새 비밀번호를 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호 *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="최소 6자 이상 입력하세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  비밀번호는 최소 6자 이상이어야 합니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handlePasswordChange} disabled={isPasswordUpdating}>
                {isPasswordUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                변경
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
