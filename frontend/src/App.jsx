import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RestaurantDetailPage from "./pages/RestaurantDetailPage.jsx";
import ReviewWritePage from "./pages/ReviewWritePage.jsx";
import RankingPage from "./pages/RankingPage.jsx";
import MyPage from "./pages/MyPage.jsx";
import GenericPage from "./pages/GenericPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/search"
          element={
            <GenericPage
              title="맛집 검색"
              subtitle="검색 결과와 필터를 확인하는 페이지입니다."
              type="search"
            />
          }
        />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route
          path="/ranking/popular"
          element={
            <GenericPage
              title="인기 랭킹 리스트"
              subtitle="많은 사랑을 받은 리뷰와 맛집을 모아봅니다."
              type="ranking"
            />
          }
        />
        <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
        <Route path="/review/new" element={<ReviewWritePage />} />

        <Route
          path="/register"
          element={
            <GenericPage
              title="맛집 등록"
              subtitle="새로운 맛집 정보를 입력하는 페이지입니다."
              type="form"
            />
          }
        />
        <Route
          path="/verified"
          element={
            <GenericPage
              title="인증 맛집 정보"
              subtitle="영수증 인증이 완료된 신뢰 맛집입니다."
              type="verified"
            />
          }
        />
        <Route
          path="/map"
          element={
            <GenericPage
              title="지도 보기"
              subtitle="주변 맛집 위치를 확인합니다."
              type="map"
            />
          }
        />
        <Route
          path="/recommended"
          element={
            <GenericPage
              title="추천 맛집"
              subtitle="사용자 추천수가 높은 맛집입니다."
              type="cards"
            />
          }
        />
        <Route
          path="/verify-photo"
          element={
            <GenericPage
              title="사진 리뷰 확인"
              subtitle="방문 사진과 영수증 인증을 확인합니다."
              type="form"
            />
          }
        />
        <Route
          path="/business-score"
          element={
            <GenericPage
              title="별점 및 추천 수 확인"
              subtitle="맛집의 별점, 추천 수, 신뢰도를 확인합니다."
              type="ranking"
            />
          }
        />

        <Route path="/my" element={<MyPage />} />
        <Route
          path="/my/profile"
          element={
            <GenericPage
              title="내 프로필"
              subtitle="프로필 정보와 레벨을 관리합니다."
              type="profile"
            />
          }
        />
        <Route
          path="/my/trust"
          element={
            <GenericPage
              title="신뢰점수 확인"
              subtitle="내 리뷰 신뢰도와 다음 레벨까지의 진행도를 확인합니다."
              type="trust"
            />
          }
        />
        <Route
          path="/my/level"
          element={
            <GenericPage
              title="쩝쩝 디미트 레벨 확인"
              subtitle="현재 등급과 성장 지표를 확인합니다."
              type="trust"
            />
          }
        />
        <Route
          path="/my/reviews"
          element={
            <GenericPage
              title="내가 쓴 리뷰"
              subtitle="작성한 리뷰 목록입니다."
              type="reviews"
            />
          }
        />
        <Route
          path="/my/saved"
          element={
            <GenericPage
              title="저장한 맛집"
              subtitle="북마크한 맛집 목록입니다."
              type="cards"
            />
          }
        />
        <Route
          path="/my/activity"
          element={
            <GenericPage
              title="최근 활동 기록"
              subtitle="최근 방문, 추천, 댓글 활동입니다."
              type="activity"
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
