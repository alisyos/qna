'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'

export function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)

  return (
    <>
      <footer className="bg-gray-100 border-t border-gray-200 py-6 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span className="font-medium text-gray-800">(주)에이아이웹</span>
            <span>대표. 임성기</span>
            <span>사업자번호. 214-87-45437</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            서울특별시 금천구 가산디지털1로 168, 비동 312호(가산동, 우림라이온스밸리)
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
            <span>TEL. 02-3482-2004</span>
            <span>Mail. hello@aiweb.kr</span>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-blue-600 hover:underline"
            >
              개인정보 처리방침
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} AIWEB. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 개인정보 처리방침 팝업 */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">개인정보처리방침</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6 text-sm text-gray-700 leading-relaxed">
            <p>
              주식회사 에이아이웹은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제1조(개인정보의 처리 목적)</h3>
              <p className="mb-2">
                주식회사 에이아이웹은 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인 확인, 부정 이용 방지</li>
                <li>민원 처리: 문의사항 또는 업무 요청에 대한 회신</li>
                <li>기타 법령에 따른 의무 이행</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제2조(처리하는 개인정보 항목 및 보유 기간)</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">1. 처리하는 개인정보 항목</p>
                  <p className="pl-4">ㆍ필수항목: 회사명, 성명, 부서, 연락처(전화번호, 이메일), 주소 등</p>
                </div>
                <div>
                  <p className="font-medium">2. 보유 기간</p>
                  <p className="pl-4">ㆍ회원 가입 및 관리: 회원 탈퇴 시까지</p>
                  <p className="pl-4">ㆍ법령에 따른 의무: 관련 법령에서 정한 기간 동안 보유</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제3조(개인정보의 제3자 제공)</h3>
              <p>
                주식회사 에이아이웹은 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제4조(정보주체와 법정대리인의 권리·의무 및 행사 방법)</h3>
              <p className="mb-2">정보주체는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 등의 권리를 행사할 수 있습니다.</p>
              <p className="pl-4">ㆍ권리 행사 방법: 서면, 전화, 이메일 등</p>
              <p className="pl-4">ㆍ처리 기한: 요청 접수 후 10일 이내</p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제5조(개인정보의 파기 절차 및 방법)</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">1. 파기 절차</p>
                  <p className="pl-4">ㆍ개인정보의 보유 기간이 경과하거나 처리 목적이 달성된 경우, 내부 방침 및 관련 법령에 따라 즉시 파기합니다.</p>
                </div>
                <div>
                  <p className="font-medium">2. 파기 방법</p>
                  <p className="pl-4">ㆍ전자적 파일: 복구 불가능한 방법으로 삭제</p>
                  <p className="pl-4">ㆍ종이 문서: 분쇄하거나 소각</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제6조(개인정보 보호책임자 및 담당자)</h3>
              <p className="mb-2">개인정보 보호법 제31조에 따라 개인정보 보호책임자를 지정하고 있습니다.</p>
              <p className="pl-4">ㆍ개인정보 보호책임자: 김형준</p>
              <p className="pl-4">ㆍ연락처: 02-3482-2004</p>
              <p className="pl-4">ㆍ이메일: hjkim@aiweb.kr</p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제7조(권익침해 구제 방법)</h3>
              <p className="mb-2">정보주체는 개인정보 침해로 인한 구제를 받기 위해 아래 기관에 문의할 수 있습니다.</p>
              <p className="pl-4">ㆍ개인정보침해신고센터(한국인터넷진흥원): 118</p>
              <p className="pl-4">ㆍ대검찰청 사이버수사과: 1301</p>
              <p className="pl-4">ㆍ경찰청 사이버안전국: 182</p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">제8조(개인정보 처리방침 변경)</h3>
              <p>
                이 개인정보처리방침은 2024년 12월 1일부터 적용되며, 법령 및 방침에 따른 변경 내용은 홈페이지를 통해 공지합니다.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
