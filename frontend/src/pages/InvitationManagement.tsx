/**
 * 초대 관리 페이지 컴포넌트
 * 
 * STEP 14: 초대 시스템
 * - 새로운 초대 생성
 * - 초대 목록 조회 및 관리
 * - 초대 통계 표시
 * - 초대 링크 복사 기능
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Copy, Plus, Users, UserCheck, UserX, BarChart3 } from 'lucide-react';
import api from '@/services/api';

// 초대 타입 정의
interface Invitation {
  id: number;
  email: string;
  token: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
  user?: {
    id: number;
    nickname: string;
    email: string;
  };
}

// 초대 통계 타입
interface InvitationStats {
  total_invitations: number;
  used_invitations: number;
  pending_invitations: number;
  total_users: number;
  max_invitations: number;
  remaining_slots: number;
}

const InvitationManagement: React.FC = () => {
  // 상태 관리
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 데이터 로드 함수
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 초대 목록과 통계를 병렬로 로드
      const [invitationsResponse, statsResponse] = await Promise.all([
        api.get('/invitations'),
        api.get('/invitations/stats')
      ]);
      
      setInvitations(invitationsResponse.data);
      setStats(statsResponse.data);
    } catch (err: any) {
      console.error('데이터 로드 오류:', err);
      setError(err.response?.data?.error || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 초대 생성
  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post('/invitations', {
        email: newEmail.trim()
      });

      setSuccess(`초대장이 생성되었습니다: ${response.data.invitation.email}`);
      setNewEmail('');
      
      // 데이터 새로고침
      await loadData();
    } catch (err: any) {
      console.error('초대 생성 오류:', err);
      setError(err.response?.data?.error || '초대 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초대 삭제 (사용되지 않은 것만)
  const deleteInvitation = async (invitationId: number) => {
    if (!window.confirm('정말로 이 초대를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.delete(`/invitations/${invitationId}`);
      setSuccess('초대가 삭제되었습니다.');
      
      // 데이터 새로고침
      await loadData();
    } catch (err: any) {
      console.error('초대 삭제 오류:', err);
      setError(err.response?.data?.error || '초대 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초대 링크 복사
  const copyInvitationLink = async (token: string) => {
    const invitationUrl = `${window.location.origin}/register?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setSuccess('초대 링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 오류:', err);
      // 클립보드 API가 지원되지 않는 경우 대체 방법
      const textArea = document.createElement('textarea');
      textArea.value = invitationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess('초대 링크가 복사되었습니다.');
    }
  };

  // 필터링된 초대 목록
  const filteredInvitations = invitations.filter(invitation => {
    if (filter === 'used') return invitation.is_used;
    if (filter === 'unused') return !invitation.is_used;
    return true;
  });

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">초대 관리</h1>
            <p className="text-gray-600">새로운 사용자를 초대하고 초대 현황을 관리하세요</p>
          </div>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  최대 {stats.max_invitations}명
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">사용된 초대</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.used_invitations}</div>
                <p className="text-xs text-muted-foreground">
                  전체 초대 중 {stats.total_invitations > 0 ? Math.round((stats.used_invitations / stats.total_invitations) * 100) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">대기 중인 초대</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending_invitations}</div>
                <p className="text-xs text-muted-foreground">
                  아직 사용되지 않음
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">남은 자리</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.remaining_slots}</div>
                <p className="text-xs text-muted-foreground">
                  초대 가능한 수
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 새 초대 생성 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              새 초대 생성
            </CardTitle>
            <CardDescription>
              이메일 주소를 입력하여 새로운 사용자를 초대하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createInvitation} className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={loading || !newEmail.trim() || (stats?.remaining_slots || 0) <= 0}
              >
                {loading ? '생성 중...' : '초대 생성'}
              </Button>
            </form>
            
            {stats && stats.remaining_slots <= 0 && (
              <p className="text-sm text-red-600 mt-2">
                최대 초대 수에 도달했습니다. 더 이상 초대할 수 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 초대 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>초대 목록</CardTitle>
                <CardDescription>
                  생성된 모든 초대의 상태를 확인하고 관리하세요
                </CardDescription>
              </div>
              
              {/* 필터 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  전체
                </Button>
                <Button
                  variant={filter === 'used' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('used')}
                >
                  사용됨
                </Button>
                <Button
                  variant={filter === 'unused' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unused')}
                >
                  대기 중
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && invitations.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">로딩 중...</div>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === 'all' ? '초대가 없습니다.' :
                 filter === 'used' ? '사용된 초대가 없습니다.' :
                 '대기 중인 초대가 없습니다.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-sm text-gray-500">
                            생성일: {formatDate(invitation.created_at)}
                            {invitation.used_at && (
                              <span className="ml-2">
                                • 사용일: {formatDate(invitation.used_at)}
                              </span>
                            )}
                          </div>
                          {invitation.user && (
                            <div className="text-sm text-blue-600">
                              사용자: {invitation.user.nickname}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={invitation.is_used ? 'default' : 'secondary'}>
                        {invitation.is_used ? '사용됨' : '대기 중'}
                      </Badge>
                      
                      {!invitation.is_used && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInvitationLink(invitation.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteInvitation(invitation.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvitationManagement;