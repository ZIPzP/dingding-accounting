/**
 * 全局错误兜底组件
 * 任何页面出现渲染错误时，显示友好的恢复界面，而不是黑屏/白屏
 */
import React from 'react';
import { Button } from 'antd';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    console.error('页面渲染错误:', error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, message: '' });
    try {
      window.location.hash = '#/';
    } catch { /* noop */ }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-boundary">
        <div className="error-boundary-emoji">😵</div>
        <h2 className="error-boundary-title">页面出了点小状况</h2>
        <p className="error-boundary-desc">
          很抱歉，这里发生了一个意外错误。你的数据都安全地保存在本地，别担心。
        </p>
        {this.state.message && (
          <p className="error-boundary-detail">{this.state.message}</p>
        )}
        <div className="error-boundary-actions">
          <Button type="primary" size="large" onClick={this.handleRetry}>
            再试一次
          </Button>
          <Button size="large" onClick={this.handleGoHome}>
            回首页
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
